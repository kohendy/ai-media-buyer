import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productInsights } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const bodySchema = z.object({
  statement: z.string().min(2).optional(),
  detail: z.string().optional(),
  status: z.enum(["draft", "confirmed", "rejected", "needs_review"]).optional(),
  pinned: z.boolean().optional(),
  proofStatus: z.enum(["verified", "needs_proof", "unverifiable"]).optional(),
  claimRisk: z.enum(["low", "medium", "high"]).optional(),
  priority: z.number().int().optional(),
});

/** Edit, kunci, tolak, atau konfirmasi satu insight. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Perubahan insight tidak valid.");

    const [before] = await db.select().from(productInsights).where(eq(productInsights.id, id)).limit(1);
    if (!before) return fail(404, "INSIGHT_NOT_FOUND", "Insight tidak ditemukan.");

    const [row] = await db
      .update(productInsights)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(productInsights.id, id))
      .returning();

    await recordAudit({
      userId: user.id,
      action: row.status === "rejected" ? "reject" : "update",
      entityType: "product_insights",
      entityId: id,
      before: { status: before.status, statement: before.statement, proofStatus: before.proofStatus },
      after: { status: row.status, statement: row.statement, proofStatus: row.proofStatus },
    });

    return ok({ insight: row });
  });
}
