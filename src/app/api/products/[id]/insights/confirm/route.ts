import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { productInsights, products } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

/** Konfirmasi satu set insight sebagai sumber landing page dan creative (khusus pemilik). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireOwner();
    const { id } = await context.params;

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return fail(404, "PRODUCT_NOT_FOUND", "Produk tidak ditemukan.");

    const body = await readJson<{ insightIds?: string[]; onlyWithProof?: boolean }>(request);

    const rows = body.insightIds?.length
      ? await db
          .update(productInsights)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(and(eq(productInsights.productId, id), inArray(productInsights.id, body.insightIds)))
          .returning()
      : await db
          .update(productInsights)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(
            and(
              eq(productInsights.productId, id),
              body.onlyWithProof ? eq(productInsights.proofStatus, "verified") : eq(productInsights.status, "draft"),
            ),
          )
          .returning();

    await recordAudit({
      userId: user.id,
      action: "approve",
      entityType: "product_insights",
      entityId: id,
      before: { confirmed: 0 },
      after: { confirmed: rows.length },
    });

    return ok({ confirmed: rows.length, insights: rows });
  });
}
