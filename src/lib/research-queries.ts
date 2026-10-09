import { db } from "@/db";
import { jobs, marketBriefs, products, judgments, judgmentQuestions } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Source, Score } from "@/lib/riset-types";

export type ProductStatus = "candidate" | "selected" | "rejected" | "archived";

export interface ResearchCandidate {
  id: string;
  name: string;
  kind: string;
  score: number | null;
  confidence: number | null;
  context: Record<string, unknown> | null;
  status: ProductStatus;
  marketBrief: {
    id: string;
    demandSummary: string;
    priceMin: number | null;
    priceMax: number | null;
    version: number;
    createdAt: string;
  } | null;
  latestJob: {
    id: string;
    status: "queued" | "running" | "succeeded" | "failed";
    error: string | null;
    createdAt: string;
  } | null;
  scores: Score[];
}

/**
 * Ambil daftar kandidan riset dengan market brief terbaru, job terbaru, dan skor Jev per pertanyaan.
 * Query langsung ke DB (tanpa fetch ke API).
 */
export async function listResearchCandidates(): Promise<ResearchCandidate[]> {
  // 1. Ambil produk dengan origin=research
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      kind: products.kind,
      score: products.score,
      confidence: products.confidence,
      context: products.context,
      status: products.status,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(eq(products.origin, "research"))
    .orderBy(desc(products.createdAt));

  if (productRows.length === 0) return [];

  const productIds = productRows.map((p) => p.id);

  // 2. Ambil market brief terbaru per produk (versi tertinggi)
  const latestBriefs = await db
    .select({
      productId: marketBriefs.productId,
      id: marketBriefs.id,
      demandSummary: marketBriefs.demandSummary,
      priceMin: marketBriefs.priceMin,
      priceMax: marketBriefs.priceMax,
      version: marketBriefs.version,
      createdAt: marketBriefs.createdAt,
    })
    .from(marketBriefs)
    .where(sql`${marketBriefs.productId} IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`)
    .orderBy(marketBriefs.productId, desc(marketBriefs.version));

  // Ambil hanya versi tertinggi per produk
  const briefMap = new Map<string, typeof latestBriefs[0]>();
  for (const brief of latestBriefs) {
    if (!briefMap.has(brief.productId)) {
      briefMap.set(brief.productId, brief);
    }
  }

  // 3. Ambil job terbaru per produk (cocokkan jobs.input->'productIds' dengan productId)
  const jobRows = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.workflowKey, "research"),
        sql`${jobs.input}->'productIds' ?| ${sql.join(productIds.map((id) => sql`${id}`), sql`, `)}`
      )
    )
    .orderBy(desc(jobs.createdAt));

  const jobMap = new Map<string, typeof jobRows[0]>();
  for (const job of jobRows) {
    const input = job.input as Record<string, unknown> | null;
    const pids = (input?.productIds as string[]) ?? [];
    for (const pid of pids) {
      if (!jobMap.has(pid)) jobMap.set(pid, job);
    }
  }

  // 4. Ambil skor Jev (judgments) terbaru per produk per pertanyaan
  const questionKeys = ["demand", "competition", "margin", "ad_ease", "owner_fit"] as const;
  const questionRows = await db
    .select()
    .from(judgmentQuestions)
    .where(sql`${judgmentQuestions.key} IN (${sql.join(questionKeys.map((k) => sql`${k}`), sql`, `)})`);

  const questionMap = new Map<string, string>();
  for (const q of questionRows) {
    questionMap.set(q.key, q.id);
  }

  const scoresByProduct = new Map<string, Score[]>();
  for (const [key, qid] of questionMap) {
    const judgmentsRows = await db
      .select()
      .from(judgments)
      .where(
        and(
          eq(judgments.questionId, qid),
          eq(judgments.subjectType, "product"),
          sql`${judgments.subjectId} IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`
        )
      )
      .orderBy(desc(judgments.createdAt));

    for (const j of judgmentsRows) {
      if (!scoresByProduct.has(j.subjectId)) {
        scoresByProduct.set(j.subjectId, []);
      }
      const existing = scoresByProduct.get(j.subjectId)!;
      // Hanya ambil yang pertama (terbaru) per questionKey per produk
      if (!existing.some((s) => s.questionKey === key)) {
        existing.push({
          questionKey: key,
          answer: j.answer,
          confidence: Number(j.confidence),
          forwarded: j.forwarded,
        });
      }
    }
  }

  // 5. Gabungkan semua data
  return productRows.map((p) => {
    const brief = briefMap.get(p.id) ?? null;
    const job = jobMap.get(p.id) ?? null;
    const scores = scoresByProduct.get(p.id) ?? [];

    return {
      id: p.id,
      name: p.name,
      kind: p.kind,
      score: p.score ? Number(p.score) : null,
      confidence: p.confidence ? Number(p.confidence) * 100 : null,
      context: p.context as Record<string, unknown> | null,
      status: p.status,
      marketBrief: brief
        ? {
            id: brief.id,
            demandSummary: brief.demandSummary,
            priceMin: brief.priceMin,
            priceMax: brief.priceMax,
            version: brief.version,
            createdAt: brief.createdAt instanceof Date ? brief.createdAt.toISOString() : brief.createdAt,
          }
        : null,
      latestJob: job
        ? {
            id: job.id,
            status: job.status as "queued" | "running" | "succeeded" | "failed",
            error: job.error,
            createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
          }
        : null,
      scores,
    };
  });
}

/**
 * Ambil market brief detail untuk satu produk (untuk halaman /riset/[id])
 */
export async function getMarketBriefDetail(productId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) return null;

  const [brief] = await db
    .select()
    .from(marketBriefs)
    .where(eq(marketBriefs.productId, productId))
    .orderBy(desc(marketBriefs.version))
    .limit(1);

  // Ambil skor Jev
  const questionKeys = ["demand", "competition", "margin", "ad_ease", "owner_fit"] as const;
  const scores: Score[] = [];

  for (const key of questionKeys) {
    const [question] = await db
      .select()
      .from(judgmentQuestions)
      .where(eq(judgmentQuestions.key, key))
      .limit(1);

    if (question) {
      const [judgment] = await db
        .select()
        .from(judgments)
        .where(
          and(
            eq(judgments.questionId, question.id),
            eq(judgments.subjectId, productId),
            eq(judgments.subjectType, "product")
          )
        )
        .orderBy(desc(judgments.createdAt))
        .limit(1);

      if (judgment) {
        scores.push({
          questionKey: key,
          answer: judgment.answer,
          confidence: Number(judgment.confidence),
          forwarded: judgment.forwarded,
        });
      }
    }
  }

  const typedBrief = brief
    ? {
        ...brief,
        sources: (brief.sources as Source[]) ?? [],
        recommendation: brief.contentMd?.includes("## Rekomendasi")
          ? brief.contentMd.split("## Rekomendasi")[1]?.split("\n##")[0]?.trim() ?? null
          : null,
        createdAt: brief.createdAt instanceof Date ? brief.createdAt.toISOString() : brief.createdAt,
      }
    : null;

  return {
    product: {
      id: product.id,
      name: product.name,
      score: product.score,
      confidence: product.confidence,
      status: product.status,
    },
    brief: typedBrief,
    scores,
  };
}