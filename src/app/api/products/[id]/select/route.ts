import { eq } from "drizzle-orm";
import { db } from "@/db";
import { marketBriefs, products } from "@/db/schema";
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

    // Validasi: wajib punya market brief
    const [brief] = await db
      .select()
      .from(marketBriefs)
      .where(eq(marketBriefs.productId, id))
      .limit(1);
    if (!brief) {
      return fail(409, "NO_MARKET_BRIEF", "Belum ada market brief untuk produk ini. Tunggu riset selesai.");
    }

    // Transaksi: produk lama selected -> candidate, produk ini -> selected
    await db.transaction(async (tx) => {
      // 1. Kembalikan produk lain yang sedang selected ke candidate
      const [prevSelected] = await tx
        .select()
        .from(products)
        .where(eq(products.status, "selected"))
        .limit(1);

      if (prevSelected && prevSelected.id !== id) {
        await tx
          .update(products)
          .set({ status: "candidate", selectedAt: null })
          .where(eq(products.id, prevSelected.id));

        await recordAudit({
          userId: user.id,
          action: "update",
          entityType: "products",
          entityId: prevSelected.id,
          before: { status: "selected" },
          after: { status: "candidate" },
        });
      }

      // 2. Set produk ini ke selected
      const [updated] = await tx
        .update(products)
        .set({ status: "selected", selectedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      // 3. Set active_product_id di settings
      await setSetting("active_product_id", updated.id, user.id);

      // 4. Audit log
      await recordAudit({
        userId: user.id,
        action: "update",
        entityType: "products",
        entityId: updated.id,
        before: { status: product.status },
        after: { status: updated.status, selectedAt: updated.selectedAt },
      });
    });

    return ok({ product: { id, status: "selected" } });
  });
}