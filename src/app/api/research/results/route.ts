import { db } from "@/db";
import { jobs, judgmentQuestions, judgments, marketBriefs, products, auditLog } from "@/db/schema";
import { apiHandler, fail, header, ok, readJson } from "@/lib/api";
import { checkSharedSecret } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { and, desc, eq, sql } from "drizzle-orm";
import { researchResultsSchema, type ResearchResults } from "@/lib/research-results-schema";
import { answerToScore, calculateAverageScore } from "@/lib/riset-scoring";
import { parsePriceRange } from "@/lib/riset-price";

/** Terima hasil riset dari n8n (dengan secret), simpan ke judgments & market_briefs. */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const env = getEnv();

    // Auth: x-n8n-secret
    const secret = header(request, "x-n8n-secret");
    if (!checkSharedSecret(secret, env.N8N_TRIGGER_SECRET)) {
      return fail(401, "UNAUTHORIZED", "Secret n8n tidak valid.");
    }

    // Validasi payload
    const parsed = researchResultsSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail(400, "INVALID_BODY", "Payload hasil riset tidak valid.", {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const data: ResearchResults = parsed.data;
    const { jobId, productId, scores, marketBrief, sources } = data;

    // Cek job ada
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) return fail(404, "JOB_NOT_FOUND", "Job tidak ditemukan.");

    // Validasi: job harus workflowKey=research
    if (job.workflowKey !== "research") {
      return fail(400, "INVALID_WORKFLOW", "Job bukan workflow research.");
    }

    // Validasi: job belum final (bukan succeeded/failed)
    if (job.status === "succeeded" || job.status === "failed") {
      return fail(409, "JOB_FINAL", "Job sudah selesai, tidak bisa menambah hasil.");
    }

    // Validasi: productId harus termasuk di job.input.productIds
    const jobInput = job.input as Record<string, unknown> | null;
    const jobProductIds = (jobInput?.productIds as string[]) ?? [];
    if (!jobProductIds.includes(productId)) {
      return fail(400, "PRODUCT_NOT_IN_JOB", "Produk tidak termasuk dalam job ini.");
    }

    // Cek produk ada
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) return fail(404, "PRODUCT_NOT_FOUND", "Produk tidak ditemukan.");

    const now = new Date();

    // Transaksi: simpan judgments + market_briefs + update job
    await db.transaction(async (tx) => {
      // 1. Pastikan judgmentQuestions ada untuk 5 kunci, ambil IDs
      const questionKeys = ["demand", "competition", "margin", "ad_ease", "owner_fit"] as const;
      const questionMap = new Map<string, string>();

      for (const key of questionKeys) {
        const [existing] = await tx
          .select()
          .from(judgmentQuestions)
          .where(and(eq(judgmentQuestions.key, key), eq(judgmentQuestions.isActive, true)))
          .limit(1);

        if (existing) {
          questionMap.set(key, existing.id);
        } else {
          const [created] = await tx
            .insert(judgmentQuestions)
            .values({
              key,
              appliesTo: "product",
              prompt: `Penilaian ${key} untuk produk`,
              answerType: "choice",
              options: ["rendah", "sedang", "tinggi"],
              threshold: env.JEV_CONFIDENCE_THRESHOLD.toFixed(3),
            })
            .returning();
          questionMap.set(key, created.id);
        }
      }

      // 2. Idempotensi: cek apakah hasil untuk (jobId, productId) sudah tercatat
      const existingJudgment = await tx
        .select()
        .from(judgments)
        .where(
          and(
            eq(judgments.subjectType, "product"),
            eq(judgments.subjectId, productId),
            sql`${judgments.questionId} IN (${sql.join(Array.from(questionMap.values()).map((v) => sql`${v}`), sql`, `)})`
          )
        )
        .limit(1);

      if (existingJudgment) {
        // Sudah diproses, kembalikan duplicate
        return { duplicate: true };
      }

      // 3. Simpan judgments untuk setiap skor (dengan answerToScore untuk validasi)
      for (const score of scores) {
        const questionId = questionMap.get(score.questionKey);
        if (!questionId) continue;

        // Validasi skor pakai answerToScore (akan throw kalau jawaban tidak valid)
        answerToScore(score.questionKey, score.answer);

        await tx.insert(judgments).values({
          questionId,
          subjectType: "product",
          subjectId: productId,
          answer: score.answer,
          probabilities: { [score.answer]: score.confidence },
          confidence: score.confidence.toFixed(3),
          forwarded: score.confidence < env.JEV_CONFIDENCE_THRESHOLD,
          model: "n8n_research",
        });
      }

      // 4. Simpan market_briefs (version auto-increment)
      const [latestBrief] = await tx
        .select()
        .from(marketBriefs)
        .where(eq(marketBriefs.productId, productId))
        .orderBy(desc(marketBriefs.version))
        .limit(1);

      const nextVersion = (latestBrief?.version ?? 0) + 1;

      // Parse price range
      const { min: priceMin, max: priceMax } = parsePriceRange(marketBrief.marketPrice);

      // Parse competitors string ke array object
      const competitorsArray = marketBrief.competitors
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ summary: line }));

      await tx.insert(marketBriefs).values({
        productId,
        version: nextVersion,
        demandSummary: marketBrief.summary,
        priceMin: priceMin ?? null,
        priceMax: priceMax ?? null,
        competitors: competitorsArray,
        gaps: marketBrief.gaps,
        risks: marketBrief.risks,
        validationPlan: marketBrief.validationPlan,
        sources: sources.map((s) => ({
          label: s.label,
          url: s.url,
          retrievedAt: s.retrievedAt,
          kind: s.kind,
        })),
        contentMd: buildMarketBriefMarkdown(marketBrief, sources),
      });

      // 5. Update job: track completedProductIds
      const currentOutput = job.output as Record<string, unknown> | null;
      const completed = (currentOutput?.completedProductIds as string[]) ?? [];
      if (!completed.includes(productId)) {
        completed.push(productId);
      }

      const allCompleted = jobProductIds.every((pid) => completed.includes(pid));
      const newStatus = allCompleted ? "succeeded" : "running";

      await tx
        .update(jobs)
        .set({
          status: newStatus,
          output: {
            ...currentOutput,
            completedProductIds: completed,
            lastProductId: productId,
            marketBriefVersion: nextVersion,
            scoresCount: scores.length,
          },
          finishedAt: newStatus === "succeeded" ? now : null,
          startedAt: job.status === "queued" ? now : job.startedAt,
        })
        .where(eq(jobs.id, jobId));

      // 6. Update product dengan skor rata-rata 1-5 & confidence
      const avgScore = calculateAverageScore(scores);
      const avgConfidence = scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length;

      await tx
        .update(products)
        .set({
          score: avgScore.toFixed(2),
          confidence: avgConfidence.toFixed(3),
        })
        .where(eq(products.id, productId));

      // 7. Audit log (pakai tx untuk konsistensi transaksi)
      await tx.insert(auditLog).values({
        userId: null,
        action: "create",
        entityType: "market_briefs",
        entityId: productId,
        after: {
          productId,
          version: nextVersion,
          scores: scores.map((s) => ({ questionKey: s.questionKey, answer: s.answer, confidence: s.confidence })),
          sourcesCount: sources.length,
        },
      });
    });

    return ok({ success: true, jobId, productId });
  });
}

/** Build markdown content untuk market_briefs.contentMd. */
function buildMarketBriefMarkdown(brief: ResearchResults["marketBrief"], sources: ResearchResults["sources"]): string {
  const lines = [
    `# Market Brief — ${brief.summary}`,
    "",
    `## Permintaan`,
    brief.demand,
    "",
    `## Harga Pasar`,
    brief.marketPrice,
    "",
    `## Kompetitor`,
    brief.competitors,
    "",
    `## Celah Pasar`,
    brief.gaps,
    "",
    `## Risiko`,
    brief.risks,
    "",
    `## Rekomendasi`,
    brief.recommendation,
    "",
    `## Rencana Validasi`,
    brief.validationPlan,
    "",
    `## Sumber Data`,
    ...sources.map((s) => `- [${s.kind.toUpperCase()}] ${s.label} (${s.retrievedAt})${s.url ? ` — ${s.url}` : ""}`),
  ];
  return lines.join("\n");
}