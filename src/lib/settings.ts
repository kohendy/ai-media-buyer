import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recordAudit } from "./audit";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return (row?.value as T) ?? fallback;
}

export async function setSetting(key: string, value: unknown, userId?: string | null) {
  const [existing] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  await db
    .insert(settings)
    .values({ key, value, updatedBy: userId ?? null })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedBy: userId ?? null, updatedAt: new Date() },
    });
  return { before: existing?.value ?? null, after: value };
}

export const isKillSwitchActive = () => getSetting<boolean>("kill_switch_active", false);

export async function setKillSwitch(active: boolean, userId?: string | null) {
  const before = await isKillSwitchActive();
  await setSetting("kill_switch_active", active, userId);
  await recordAudit({
    userId: userId ?? null,
    action: active ? "kill" : "resume",
    entityType: "settings",
    entityId: null,
    before: { kill_switch_active: before },
    after: { kill_switch_active: active },
  });
  return active;
}

export const getTargetCpa = () => getSetting<number>("target_cpa", 60_000);
export const getDailySpendCap = () => getSetting<number>("daily_spend_cap", 2_000_000);
export const getTargetRoas = () => getSetting<number>("target_roas", 3.0);
export const getActiveProductId = () => getSetting<string | null>("active_product_id", null);
export const getOperatingMode = () => getSetting<"suggest_approve" | "auto">("operating_mode", "suggest_approve");
