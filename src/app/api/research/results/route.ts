import { db } from "@/db";
import { jobs, judgmentQuestions, judgments, marketBriefs, products } from "@/db/schema";
import { apiHandler, fail, header, ok, readJson } from "@/lib/api";
import { checkSharedSecret } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { recordAudit } from "@/lib/audit";
import { and, desc, eq } from "drizzle-orm";
import { researchResultsSchema, type ResearchResults } from "@/lib/research-results-schema";

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

      // 2. Simpan judgments untuk setiap skor
      for (const score of scores) {
        const questionId = questionMap.get(score.questionKey);
        if (!questionId) continue; // seharusnya tidak terjadi

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

      // 3. Simpan market_briefs (upsert by productId + version)
      // Ambil versi terbaru
      const [latestBrief] = await tx
        .select()
        .from(marketBriefs)
        .where(eq(marketBriefs.productId, productId))
        .orderBy(desc(marketBriefs.version))
        .limit(1);

      const nextVersion = (latestBrief?.version ?? 0) + 1;

      await tx.insert(marketBriefs).values({
        productId,
        version: nextVersion,
        demandSummary: marketBrief.summary,
        priceMin: parsePriceMin(marketBrief.marketPrice),
        priceMax: parsePriceMax(marketBrief.marketPrice),
        competitors: [], // JSON string dari marketBrief.competitors jika perlu parsing
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

      // 4. Update job status
      await tx
        .update(jobs)
        .set({
          status: "succeeded",
          output: {
            productId,
            marketBriefVersion: nextVersion,
            scoresCount: scores.length,
          },
          finishedAt: now,
        })
        .where(eq(jobs.id, jobId));

      // 5. Update product dengan skor rata-rata & confidence
      const avgScore = scores.reduce((sum, s) => sum + scoreToNumeric(s.answer), 0) / scores.length;
      const avgConfidence = scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length;

      await tx
        .update(products)
        .set({
          score: avgScore.toFixed(2),
          confidence: avgConfidence.toFixed(3),
        })
        .where(eq(products.id, productId));

      // 6. Audit log
      await recordAudit({
        userId: null, // system/n8n
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

/** Konversi jawaban ordinal ke numerik 1-3 untuk rata-rata skor. */
function scoreToNumeric(answer: string): number {
  switch (answer) {
    case "tinggi":
      return 3;
    case "sedang":
      return 2;
    case "rendah":
      return 1;
    default:
      return 2; // default sedang
  }
}

/** Parse priceMin dari string "Rp 89.000 – 159.000" atau "89000-159000". */
function parsePriceMin(priceStr: string): number | null {
  const match = priceStr.match(/(\d[\d.,]*)/);
  if (!match) return null;
  return parseInt(match[1].replace(/[.,]/g, ""), 10);
}

/** Parse priceMax dari string. */
function parsePriceMax(priceStr: string): number | null {
  const matches = priceStr.match(/(\d[\d.,]*)/g);
  if (!matches || matches.length < 2) return parsePriceMin(priceStr);
  return parseInt(matches[matches.length - 1].replace(/[.,]/g, ""), 10);
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