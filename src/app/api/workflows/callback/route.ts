import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { apiHandler, fail, header, ok, readJson } from "@/lib/api";
import { checkSharedSecret } from "@/lib/auth";
import { getEnv } from "@/lib/env";

/** Terima hasil dan status dari n8n (dengan secret). */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const env = getEnv();
    if (!checkSharedSecret(header(request, "x-n8n-secret"), env.N8N_TRIGGER_SECRET)) {
      return fail(401, "UNAUTHORIZED", "Secret n8n tidak valid.");
    }

    const body = await readJson<{
      jobId?: string;
      status?: "running" | "succeeded" | "failed";
      output?: Record<string, unknown>;
      error?: string;
    }>(request);

    if (!body.jobId) return fail(400, "JOB_REQUIRED", "jobId wajib diisi.");

    const now = new Date();
    const [row] = await db
      .update(jobs)
      .set({
        status: body.status ?? "succeeded",
        output: body.output ?? {},
        error: body.error ?? null,
        finishedAt: body.status === "running" ? null : now,
        startedAt: body.status === "running" ? now : undefined,
      })
      .where(eq(jobs.id, body.jobId))
      .returning();

    if (!row) return fail(404, "JOB_NOT_FOUND", "Job tidak ditemukan.");
    return ok({ job: { id: row.id, status: row.status } });
  });
}
