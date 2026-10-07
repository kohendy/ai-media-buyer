import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { jobs, previewComments, revisionRequests } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getEnv } from "@/lib/env";

const bodySchema = z.object({
  subjectType: z.enum(["landing_page", "creative"]),
  baseId: z.string().uuid(),
  commentIds: z.array(z.string().uuid()).optional(),
});

/**
 * Buat permintaan revisi dari sekumpulan komentar, lalu picu workflow revisi.
 * Setiap revisi menghasilkan versi baru; komentar yang diproses berstatus `queued`.
 */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Permintaan revisi tidak valid.");

    const { subjectType, baseId } = parsed.data;

    const comments = parsed.data.commentIds?.length
      ? await db.select().from(previewComments).where(inArray(previewComments.id, parsed.data.commentIds))
      : await db
          .select()
          .from(previewComments)
          .where(and(eq(previewComments.subjectType, subjectType), eq(previewComments.subjectId, baseId), eq(previewComments.status, "open")));

    if (comments.length === 0) return fail(400, "NO_COMMENTS", "Tidak ada komentar untuk diproses.");
    if (comments.length > 20) return fail(400, "TOO_MANY_COMMENTS", "Maksimal 20 komentar per permintaan.");

    const [job] = await db
      .insert(jobs)
      .values({ workflowKey: "revision", trigger: "user", status: "queued", input: { subjectType, baseId } })
      .returning();

    const [revision] = await db
      .insert(revisionRequests)
      .values({ subjectType, baseId, commentCount: comments.length, jobId: job.id, status: "queued", requestedBy: user.id })
      .returning();

    await db
      .update(previewComments)
      .set({ status: "queued", revisionRequestId: revision.id })
      .where(inArray(previewComments.id, comments.map((comment) => comment.id)));

    const env = getEnv();
    if (env.N8N_WEBHOOK_BASE) {
      try {
        await fetch(`${env.N8N_WEBHOOK_BASE.replace(/\/$/, "")}/revision`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-n8n-secret": env.N8N_TRIGGER_SECRET },
          body: JSON.stringify({ revisionId: revision.id, jobId: job.id, subjectType, baseId, commentIds: comments.map((c) => c.id) }),
        });
      } catch {
        await db.update(jobs).set({ status: "failed", error: "Gagal memicu workflow revisi." }).where(eq(jobs.id, job.id));
      }
    }

    await recordAudit({
      userId: user.id,
      action: "create",
      entityType: "revision_requests",
      entityId: revision.id,
      after: { subjectType, baseId, commentCount: comments.length },
    });

    return ok({ revision, jobId: job.id }, { status: 202 });
  });
}
