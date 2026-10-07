import { z } from "zod";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";
import { recordAudit } from "@/lib/audit";

const ALLOWED_KEYS = [
  "target_cpa",
  "target_roas",
  "daily_spend_cap",
  "active_product_id",
  "operating_mode",
  "ai_daily_cap",
  "ai_monthly_cap_idr",
  "morning_summary_time",
  "approval_ttl_hours",
] as const;

const payloadSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

export async function GET() {
  return apiHandler(async () => {
    await requireOwner();
    const entries = await Promise.all(ALLOWED_KEYS.map(async (key) => [key, await getSetting(key, null)] as const));
    return ok({ settings: Object.fromEntries(entries) });
  });
}

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    const user = await requireOwner();
    const body = payloadSchema.safeParse(await readJson(request));
    if (!body.success) return fail(400, "INVALID_BODY", "Nilai pengaturan tidak valid.");

    const applied: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body.data)) {
      if (!(ALLOWED_KEYS as readonly string[]).includes(key)) continue;
      const { before } = await setSetting(key, value, user.id);
      await recordAudit({
        userId: user.id,
        action: "update",
        entityType: "settings",
        entityId: null,
        before: { [key]: before },
        after: { [key]: value },
      });
      applied[key] = value;
    }

    return ok({ applied });
  });
}
