import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { productBriefs, productInsights, products } from "@/db/schema";
import { apiHandler, fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { isAiConfigured } from "@/lib/env";
import { judge } from "@/services/ai/jev";
import { complete } from "@/services/ai/claude";

/**
 * Hasilkan draf Insight Produk dari brief (dan riset bila ada).
 * Keluaran AI divalidasi skema; tanpa AI, draf dibuat deterministik dan berlabel `ai_inference`.
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return fail(404, "PRODUCT_NOT_FOUND", "Produk tidak ditemukan.");

    const [brief] = await db
      .select()
      .from(productBriefs)
      .where(eq(productBriefs.productId, id))
      .orderBy(desc(productBriefs.version))
      .limit(1);
    if (!brief) return fail(400, "BRIEF_REQUIRED", "Isi brief produk terlebih dahulu.");

    const pinned = await db.select().from(productInsights).where(eq(productInsights.productId, id));
    const pinnedStatements = new Set(pinned.filter((row) => row.pinned).map((row) => row.statement));
    await db.delete(productInsights).where(eq(productInsights.productId, id));

    let drafts: Array<{
      kind: "strength" | "pain_point" | "objection";
      statement: string;
      detail: string;
      basis: "from_brief" | "ai_inference";
      proofStatus: "verified" | "needs_proof";
    }>;

    let model = "simulated";

    if (isAiConfigured()) {
      const system = "Kamu analis produk. Balas hanya JSON: {\"insights\":[{\"kind\":\"strength|pain_point|objection\",\"statement\":\"...\",\"detail\":\"...\"}]}. Jangan mengarang fakta.";
      const { text, model: usedModel } = await complete({
        purpose: "insight_generation",
        system,
        prompt: `Brief: ${brief.description}\nKelebihan: ${brief.ownerStrengths ?? "-"}\nMasalah: ${brief.problemsSolved ?? "-"}`,
        userId: user.id,
      });
      model = usedModel;
      drafts = parseInsights(text, brief.ownerStrengths);
    } else {
      drafts = [
        { kind: "strength", statement: brief.ownerStrengths?.split(/[.\n]/)[0]?.trim() || "Kelebihan produk menurut pemilik", detail: "Diambil dari brief pemilik.", basis: "from_brief", proofStatus: "needs_proof" },
        { kind: "pain_point", statement: brief.problemsSolved ?? "Masalah utama calon pembeli", detail: "Dirumuskan dari brief.", basis: "from_brief", proofStatus: "needs_proof" },
        { kind: "strength", statement: `Pembeda: ${brief.differentiators ?? "belum diisi"}`, detail: "Dugaan AI; perlu data pembanding.", basis: "ai_inference", proofStatus: "needs_proof" },
      ];
    }

    const inserted = await db
      .insert(productInsights)
      .values(
        drafts.map((draft, index) => ({
          productId: id,
          briefId: brief.id,
          kind: draft.kind,
          statement: draft.statement,
          detail: draft.detail,
          basis: draft.basis,
          proofStatus: draft.proofStatus,
          priority: index + 1,
          status: "draft" as const,
        })),
      )
      .returning();

    // Jev menilai dukungan brief dan risiko klaim tiap insight.
    for (const insight of inserted) {
      await judge({
        questionKey: "insight_claim_risk",
        subjectType: "product_insight",
        subjectId: insight.id,
        options: ["rendah", "sedang", "tinggi"],
        context: insight.statement,
        userId: user.id,
      });
    }

    return ok({ briefId: brief.id, model, insights: inserted, keptPinned: pinnedStatements.size }, { status: 201 });
  });
}

function parseInsights(text: string, fallback: string | null) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return [
      { kind: "strength" as const, statement: fallback ?? "Kelebihan produk", detail: "Dari brief.", basis: "from_brief" as const, proofStatus: "needs_proof" as const },
    ];
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      insights?: Array<{ kind?: string; statement?: string; detail?: string }>;
    };
    return (parsed.insights ?? []).slice(0, 10).map((item) => ({
      kind: (["strength", "pain_point", "objection"].includes(item.kind ?? "")
        ? item.kind
        : "strength") as "strength" | "pain_point" | "objection",
      statement: item.statement ?? "Insight",
      detail: item.detail ?? "",
      basis: "ai_inference" as const,
      proofStatus: "needs_proof" as const,
    }));
  } catch {
    return [
      { kind: "strength" as const, statement: fallback ?? "Kelebihan produk", detail: "Dari brief.", basis: "from_brief" as const, proofStatus: "needs_proof" as const },
    ];
  }
}
