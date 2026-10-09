import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEnv } from "@/lib/env";

export interface DispatchResult {
  ok: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Dispatch workflow ke n8n webhook.
 * - Jika N8N_WEBHOOK_BASE kosong: update job failed, return { ok: false, error: "N8N_WEBHOOK_BASE belum diisi" }
 * - Timeout 10 detik
 * - Non-2xx: update job failed dengan pesan jelas
 * - 2xx: return { ok: true }, biarkan job queued sampai n8n callback
 */
export async function dispatchWorkflow({
  jobId,
  workflowKey,
  input,
}: {
  jobId: string;
  workflowKey: string;
  input: Record<string, unknown>;
}): Promise<DispatchResult> {
  const env = getEnv();

  if (!env.N8N_WEBHOOK_BASE) {
    await db.update(jobs).set({ status: "failed", error: "N8N_WEBHOOK_BASE belum diisi" }).where(eq(jobs.id, jobId));
    return { ok: false, error: "N8N_WEBHOOK_BASE belum diisi" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${env.N8N_WEBHOOK_BASE.replace(/\/$/, "")}/${workflowKey}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-n8n-secret": env.N8N_TRIGGER_SECRET },
      body: JSON.stringify({ jobId, input }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorMsg = `Webhook n8n gagal (HTTP ${res.status})`;
      await db.update(jobs).set({ status: "failed", error: errorMsg }).where(eq(jobs.id, jobId));
      return { ok: false, error: errorMsg, statusCode: res.status };
    }

    return { ok: true };
  } catch (e) {
    clearTimeout(timeoutId);
    const errorMsg = e instanceof DOMException && e.name === "AbortError"
      ? "Webhook n8n timeout (10 detik)"
      : "Gagal memicu webhook n8n";
    await db.update(jobs).set({ status: "failed", error: errorMsg }).where(eq(jobs.id, jobId));
    return { ok: false, error: errorMsg };
  }
}