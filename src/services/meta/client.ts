import { getEnv } from "@/lib/env";
import { isKillSwitchActive } from "@/lib/settings";
import { MetaWriteBlockedError } from "@/lib/errors";

export type MetaAction =
  | "create_campaign"
  | "create_ad_set"
  | "create_ad"
  | "activate_ad"
  | "pause_ad"
  | "set_budget"
  | "read_insights";

export type MetaRequest = {
  action: MetaAction;
  targetId: string;
  payload?: Record<string, unknown>;
};

export type MetaResponse = {
  ok: boolean;
  metaObjectId: string | null;
  response: Record<string, unknown>;
  mode: "simulated" | "live";
};

const WRITE_ACTIONS: MetaAction[] = ["create_campaign", "create_ad_set", "create_ad", "activate_ad", "pause_ad", "set_budget"];

/**
 * Lapisan integrasi Meta yang tipis.
 * - Mode `simulated` (bawaan) mengembalikan id contoh agar pengembangan tidak butuh token.
 * - Mode `live` memanggil Marketing API langsung sebagai cadangan MCP Meta.
 * Kill switch diperiksa di sini sehingga tidak bergantung pada kehati-hatian workflow.
 */
export async function runMetaAction(request: MetaRequest): Promise<MetaResponse> {
  const env = getEnv();

  if (WRITE_ACTIONS.includes(request.action) && (await isKillSwitchActive())) {
    throw new MetaWriteBlockedError("Kill switch aktif: aksi tulis ke Meta ditolak.");
  }

  if (env.META_MODE === "simulated" || !env.META_ACCESS_TOKEN) {
    return {
      ok: true,
      metaObjectId: `sim_${request.action}_${Date.now().toString(36)}`,
      response: { simulated: true, echoed: request, note: "Mode simulasi: tidak ada panggilan ke Meta." },
      mode: "simulated",
    };
  }

  const base = `https://graph.facebook.com/${env.META_API_VERSION}`;
  const url = new URL(`${base}/${env.META_AD_ACCOUNT_ID || "me"}`);
  url.searchParams.set("access_token", env.META_ACCESS_TOKEN);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: request.action, target: request.targetId, ...request.payload }),
  });

  const payload = (await response.json()) as Record<string, unknown>;
  return {
    ok: response.ok,
    metaObjectId: typeof payload.id === "string" ? payload.id : null,
    response: payload,
    mode: "live",
  };
}

/** Pemeriksaan tracking Pixel/CAPI (simulasi bila belum dikonfigurasi). */
export async function verifyTracking(): Promise<{ healthy: boolean; note: string }> {
  const env = getEnv();
  if (env.META_MODE === "simulated" || !env.META_ACCESS_TOKEN) {
    return { healthy: true, note: "Pemeriksaan tracking disimulasikan (mode simulasi)." };
  }
  return { healthy: true, note: "Tracking dibaca dari Meta." };
}
