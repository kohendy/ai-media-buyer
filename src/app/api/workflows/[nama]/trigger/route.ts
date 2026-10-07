import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { apiHandler, fail, header, ok, readJson } from "@/lib/api";
import { checkSharedSecret, requireUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";

const WORKFLOWS = [
  "research",
  "insight",
  "audience",
  "landing_page",
  "creative_pack",
  "launch",
  "daily_loop",
  "weekly_report",
  "sync_insights",
  "revision",
  "competitor",
] as const;

/** Picu pipeline (riset, creative, laporan) dengan secret atau sesi pengguna. */
export async function POST(request: Request, context: { params: Promise<{ nama: string }> }) {
  return apiHandler(async () => {
    const env = getEnv();
    const { nama } = await context.params;
    if (!(WORKFLOWS as readonly string[]).includes(nama)) {
      return fail(400, "UNKNOWN_WORKFLOW", "Workflow tidak dikenal.");
    }

    const authorizedBySecret = checkSharedSecret(header(request, "x-n8n-secret"), env.N8N_TRIGGER_SECRET);
    const user = authorizedBySecret ? null : await requireUser();

    const input = await readJson<Record<string, unknown>>(request);
    const [job] = await db
      .insert(jobs)
      .values({
        workflowKey: nama,
        trigger: authorizedBySecret ? "system" : "user",
        status: "queued",
        input,
      })
      .returning();

    if (env.N8N_WEBHOOK_BASE) {
      try {
        await fetch(`${env.N8N_WEBHOOK_BASE.replace(/\/$/, "")}/${nama}`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-n8n-secret": env.N8N_TRIGGER_SECRET },
          body: JSON.stringify({ jobId: job.id, input }),
        });
      } catch {
        await db.update(jobs).set({ status: "failed", error: "Gagal memicu webhook n8n." }).where(eq(jobs.id, job.id));
      }
    }

    return ok({ jobId: job.id, requestedBy: user?.id ?? "n8n" }, { status: 202 });
  });
}
