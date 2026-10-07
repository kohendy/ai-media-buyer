import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { productBriefs, productInsights, products } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const bodySchema = z.object({
  mode: z.enum(["quick", "full", "free_text"]).default("quick"),
  description: z.string().min(2),
  priceInfo: z.record(z.string(), z.unknown()).default({}),
  specs: z.string().optional(),
  ownerStrengths: z.string().optional(),
  targetBuyer: z.string().optional(),
  problemsSolved: z.string().optional(),
  differentiators: z.string().optional(),
  proof: z.record(z.string(), z.unknown()).default({}),
  claimLimits: z.string().optional(),
  offerGuarantee: z.string().optional(),
  orderChannel: z.string().optional(),
  toneNotes: z.string().optional(),
  rawText: z.string().optional(),
});

/** Perbarui brief: membuat versi baru dan menandai insight terkait perlu ditinjau. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Brief belum lengkap.");

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return fail(404, "PRODUCT_NOT_FOUND", "Produk tidak ditemukan.");

    const [latest] = await db
      .select()
      .from(productBriefs)
      .where(eq(productBriefs.productId, id))
      .orderBy(desc(productBriefs.version))
      .limit(1);

    const nextVersion = (latest?.version ?? 0) + 1;

    if (latest) {
      await db.update(productBriefs).set({ status: "superseded" }).where(eq(productBriefs.id, latest.id));
    }

    const [brief] = await db
      .insert(productBriefs)
      .values({
        productId: id,
        version: nextVersion,
        status: "submitted",
        createdBy: user.id,
        ...parsed.data,
      })
      .returning();

    await db
      .update(productInsights)
      .set({ status: "needs_review" })
      .where(and(eq(productInsights.productId, id), eq(productInsights.status, "confirmed")));

    await recordAudit({
      userId: user.id,
      action: "update",
      entityType: "product_briefs",
      entityId: brief.id,
      before: latest ? { version: latest.version } : null,
      after: { version: brief.version },
    });

    return ok({ brief });
  });
}
