import { MarketBriefView } from "@/components/riset/market-brief-view";
import { db } from "@/db";
import { marketBriefs, products, judgments, judgmentQuestions } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import type { Data, MarketBrief, Score, Source } from "@/lib/riset-types";

async function fetchMarketBrief(productId: string): Promise<Data> {
  // Ambil produk
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;

  // Ambil market brief terbaru
  const [brief] = await db
    .select()
    .from(marketBriefs)
    .where(eq(marketBriefs.productId, productId))
    .orderBy(desc(marketBriefs.version))
    .limit(1);

  // Ambil judgments untuk produk ini (5 pertanyaan)
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

  // Transform brief sources to match type
  const typedBrief: MarketBrief = brief
    ? {
        ...brief,
        sources: (brief.sources as Source[]) ?? [],
        // recommendation tidak ada di kolom DB, coba ekstrak dari contentMd
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

export const instant = false;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchMarketBrief(id);
  return <MarketBriefView productId={id} data={data} />;
}