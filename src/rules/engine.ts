import { db } from "@/db";
import { rules } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type HardCaps = {
  maxDailyBudgetPerAd: number;
  maxDailySpendTotal: number;
  maxStepPct: number;
  minGapHours: number;
};

export const DEFAULT_HARD_CAPS: HardCaps = {
  maxDailyBudgetPerAd: 500_000,
  maxDailySpendTotal: 2_000_000,
  maxStepPct: 20,
  minGapHours: 48,
};

export type ScaleRule = { cpaDaysBelowTarget: number; maxStepPct: number; minResults: number; minGapHours: number };
export type PauseRule = { cpaMultiplier: number; spendWithoutResultMultiplier: number };
export type FatigueRule = { frequencyThreshold: number; ctrDropPct: number };

export const DEFAULT_SCALE_RULE: ScaleRule = { cpaDaysBelowTarget: 4, maxStepPct: 20, minResults: 30, minGapHours: 48 };
export const DEFAULT_PAUSE_RULE: PauseRule = { cpaMultiplier: 1.5, spendWithoutResultMultiplier: 2 };
export const DEFAULT_FATIGUE_RULE: FatigueRule = { frequencyThreshold: 3.0, ctrDropPct: 15 };

async function loadRule<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db
    .select()
    .from(rules)
    .where(and(eq(rules.key, key), eq(rules.isActive, true)))
    .limit(1);
  return (row?.params as T) ?? fallback;
}

export const loadHardCaps = () => loadRule<HardCaps>("hard_caps", DEFAULT_HARD_CAPS);
export const loadScaleRule = () => loadRule<ScaleRule>("scale", DEFAULT_SCALE_RULE);
export const loadPauseRule = () => loadRule<PauseRule>("pause", DEFAULT_PAUSE_RULE);
export const loadFatigueRule = () => loadRule<FatigueRule>("fatigue", DEFAULT_FATIGUE_RULE);

/* ------------------------------------------------------------------ */
/* Batas keras — diperiksa di kode sebelum aksi dikirim ke Meta.       */
/* ------------------------------------------------------------------ */

export type HardCapCheck = {
  ok: boolean;
  checked: {
    maxStepPct: boolean;
    maxDailyBudgetPerAd: boolean;
    minGapHours: boolean;
    totalDailySpend: boolean;
    killSwitch: boolean;
  };
  violations: string[];
};

export function checkHardCaps(input: {
  kind: "scale" | "pause" | "activate" | "create";
  currentDailyBudget: number;
  proposedDailyBudget: number;
  lastScaledAt: Date | null;
  spendToday: number;
  killSwitchActive: boolean;
  caps: HardCaps;
  now?: Date;
}): HardCapCheck {
  const now = input.now ?? new Date();
  const violations: string[] = [];

  const changePct =
    input.currentDailyBudget > 0
      ? Math.abs((input.proposedDailyBudget - input.currentDailyBudget) / input.currentDailyBudget) * 100
      : 100;

  const maxStepPct = changePct <= input.caps.maxStepPct || input.kind !== "scale";
  if (!maxStepPct) violations.push(`Kenaikan ${changePct.toFixed(1)}% melewati batas ${input.caps.maxStepPct}%.`);

  const withinPerAd = input.proposedDailyBudget <= input.caps.maxDailyBudgetPerAd;
  if (!withinPerAd) violations.push(`Budget melewati batas per iklan Rp ${input.caps.maxDailyBudgetPerAd}.`);

  const hoursSinceScale = input.lastScaledAt
    ? (now.getTime() - input.lastScaledAt.getTime()) / 3_600_000
    : Number.POSITIVE_INFINITY;
  const minGap = hoursSinceScale >= input.caps.minGapHours;
  if (!minGap) violations.push(`Jeda scale ${hoursSinceScale.toFixed(1)} jam kurang dari ${input.caps.minGapHours} jam.`);

  const delta = Math.max(0, input.proposedDailyBudget - input.currentDailyBudget);
  const totalDailySpend = input.spendToday + delta <= input.caps.maxDailySpendTotal;
  if (!totalDailySpend) violations.push(`Total spend harian melewati batas Rp ${input.caps.maxDailySpendTotal}.`);

  // Kill switch: aksi tulis otomatis selalu ditolak.
  const killSwitch = !input.killSwitchActive;
  if (!killSwitch) violations.push("Kill switch aktif: aksi tulis ditolak.");

  return {
    ok: violations.length === 0,
    checked: {
      maxStepPct,
      maxDailyBudgetPerAd: withinPerAd,
      minGapHours: minGap,
      totalDailySpend,
      killSwitch,
    },
    violations,
  };
}

/* ------------------------------------------------------------------ */
/* Usulan scale & pause                                                */
/* ------------------------------------------------------------------ */

export type Metrics = { spend: number; results: number; cpa: number; roas: number; frequency: number };

export function suggestScale(
  metrics: Metrics & { daysBelowTarget: number; trackingHealthy: boolean },
  scale: ScaleRule,
  targetCpa: number,
): { propose: boolean; stepPct: number; reasons: string[] } {
  const reasons: string[] = [];
  const cpaOk = metrics.cpa > 0 && metrics.cpa <= targetCpa;
  if (cpaOk) reasons.push(`CPA Rp ${Math.round(metrics.cpa).toLocaleString("id-ID")} di bawah target.`);
  const daysOk = metrics.daysBelowTarget >= scale.cpaDaysBelowTarget;
  if (daysOk) reasons.push(`CPA di bawah target ${metrics.daysBelowTarget} hari berturut-turut.`);
  const resultsOk = metrics.results >= scale.minResults;
  if (resultsOk) reasons.push(`${metrics.results} hasil (minimum ${scale.minResults}).`);
  if (metrics.trackingHealthy) reasons.push("Tracking sehat.");

  const propose = cpaOk && daysOk && resultsOk && metrics.trackingHealthy;
  return { propose, stepPct: Math.min(scale.maxStepPct, 20), reasons };
}

export function suggestPause(
  metrics: Metrics,
  pause: PauseRule,
  targetCpa: number,
): { propose: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const cpaHigh = metrics.cpa >= targetCpa * pause.cpaMultiplier;
  if (cpaHigh)
    reasons.push(`CPA Rp ${Math.round(metrics.cpa).toLocaleString("id-ID")} melewati ${pause.cpaMultiplier}× target.`);
  const spendNoResult = metrics.results === 0 && metrics.spend >= targetCpa * pause.spendWithoutResultMultiplier;
  if (spendNoResult)
    reasons.push(
      `Belanja Rp ${Math.round(metrics.spend).toLocaleString("id-ID")} tanpa hasil (${pause.spendWithoutResultMultiplier}× CPA target).`,
    );
  return { propose: cpaHigh || spendNoResult, reasons };
}

export function detectFatigue(
  input: { frequency: number; ctrDropPct: number; cpa: number; targetCpa: number },
  fatigue: FatigueRule,
): { fatigued: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const freq = input.frequency >= fatigue.frequencyThreshold;
  if (freq) reasons.push(`Frekuensi ${input.frequency} melewati ambang ${fatigue.frequencyThreshold}.`);
  const ctr = input.ctrDropPct >= fatigue.ctrDropPct;
  if (ctr) reasons.push(`CTR turun ${input.ctrDropPct}% (ambang ${fatigue.ctrDropPct}%).`);
  const cpaHigh = input.targetCpa > 0 && input.cpa > input.targetCpa;
  if (cpaHigh && freq) reasons.push("CPA di atas target meski data cukup.");
  return { fatigued: freq && (ctr || cpaHigh), reasons };
}

export type CreativeTriggers = {
  fatigue: boolean;
  highCpa: boolean;
  abWinner: boolean;
  weeklyBatch: boolean;
};

export function shouldProposeNewCreative(triggers: CreativeTriggers) {
  const reasons: string[] = [];
  if (triggers.fatigue) reasons.push("Creative jenuh (frekuensi tinggi disertai CTR menurun).");
  if (triggers.highCpa) reasons.push("CPA di atas target meski data cukup.");
  if (triggers.abWinner) reasons.push("Pemenang A/B ditemukan: buat variasi dari angle pemenang.");
  if (triggers.weeklyBatch) reasons.push("Jadwal batch creative mingguan.");
  return { propose: reasons.length > 0, reasons };
}
