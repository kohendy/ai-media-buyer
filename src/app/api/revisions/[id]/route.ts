import { eq } from "drizzle-orm";
import { db } from "@/db";
import { previewComments, revisionRequests } from "@/db/schema";
import { apiHandler, fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";

/** Status dan hasil revisi (versi baru, tanggapan per komentar). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    await requireUser();
    const { id } = await context.params;

    const [revision] = await db.select().from(revisionRequests).where(eq(revisionRequests.id, id)).limit(1);
    if (!revision) return fail(404, "REVISION_NOT_FOUND", "Permintaan revisi tidak ditemukan.");

    const comments = await db
      .select()
      .from(previewComments)
      .where(eq(previewComments.revisionRequestId, id));

    return ok({ revision, comments });
  });
}
