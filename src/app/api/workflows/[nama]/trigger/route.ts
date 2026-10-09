import { db } from "@/db";
import { jobs } from "@/db/schema";
import { apiHandler, fail, header, ok, readJson } from "@/lib/api";
import { checkSharedSecret, requireUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { isKillSwitchActive } from "@/lib/settings";
import { dispatchWorkflow } from "@/services/n8n/dispatch";

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

    // Kill switch check untuk SEMUA pemanggil (termasuk n8n/system) sesuai PRD Keputusan 3
    if (await isKillSwitchActive()) {
      return fail(409, "KILL_SWITCH_ACTIVE", "Kill switch aktif: workflow dibatalkan.");
    }

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

    // Gunakan helper dispatchWorkflow untuk konsistensi
    const dispatchResult = await dispatchWorkflow({
      jobId: job.id,
      workflowKey: nama,
      input,
    });

    if (!dispatchResult.ok) {
      // Job sudah diupdate ke failed di dispatchWorkflow
      return fail(502, "N8N_TIDAK_TERJANGKAU", dispatchResult.error ?? "Gagal menghubungi n8n", { jobId: job.id });
    }

    return ok({ jobId: job.id, requestedBy: user?.id ?? "n8n" }, { status: 202 });
  });
}