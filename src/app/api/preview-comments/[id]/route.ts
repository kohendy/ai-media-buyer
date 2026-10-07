import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { previewComments } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";

const patchSchema = z.object({
  body: z.string().min(1).max(2000).optional(),
  replacementText: z.string().max(2000).nullable().optional(),
  status: z.enum(["open", "queued", "resolved", "disputed", "dismissed"]).optional(),
  agentResponse: z.string().max(2000).nullable().optional(),
});

/** Ubah isi, buka kembali, atau batalkan komentar. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    await requireUser();
    const { id } = await context.params;
    const parsed = patchSchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Perubahan komentar tidak valid.");

    const [row] = await db
      .update(previewComments)
      .set(parsed.data)
      .where(eq(previewComments.id, id))
      .returning();

    if (!row) return fail(404, "COMMENT_NOT_FOUND", "Komentar tidak ditemukan.");
    return ok({ comment: row });
  });
}
