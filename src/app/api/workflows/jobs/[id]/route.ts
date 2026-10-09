import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { apiHandler, fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";

/** Ambil status job by id (untuk polling UI). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    await requireUser();
    const { id } = await context.params;

    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return fail(404, "NOT_FOUND", "Job tidak ditemukan.");

    return ok({ job });
  });
}