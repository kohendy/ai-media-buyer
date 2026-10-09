import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { apiHandler, fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { setSetting } from "@/lib/settings";

/** Pilih produk: ubah status ke "selected", set active_product_id, catat audit. */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    // Cek produk ada dan status candidate
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return fail(404, "NOT_FOUND", "Produk tidak ditemukan.");
    if (product.status === "selected") return fail(409, "ALREADY_SELECTED", "Produk sudah dipilih.");
    if (product.origin !== "research") {
      return fail(400, "INVALID_ORIGIN", "Hanya produk dari riset (origin=research) yang bisa dipilih lewat alur ini.");
    }

    // Update status produk
    const [updated] = await db
      .update(products)
      .set({ status: "selected", selectedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    // Set active_product_id di settings
    await setSetting("active_product_id", updated.id, user.id);

    // Audit log
    await recordAudit({
      userId: user.id,
      action: "update",
      entityType: "products",
      entityId: updated.id,
      before: { status: product.status },
      after: { status: updated.status, selectedAt: updated.selectedAt },
    });

    return ok({ product: updated });
  });
}