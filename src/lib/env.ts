import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET minimal 16 karakter").default("dev-only-secret-change-me-please-32chars"),
  AUTH_COOKIE_NAME: z.string().default("aimb_session"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),

  AI_BASE_URL: z.string().default(""),
  AI_API_KEY: z.string().default(""),
  AI_MODEL_MAIN: z.string().default("claude-sonnet"),
  AI_MODEL_LIGHT: z.string().default("claude-haiku"),
  AI_DAILY_CALL_CAP: z.coerce.number().default(800),
  AI_MONTHLY_BUDGET_IDR: z.coerce.number().default(1_500_000),

  JEV_BASE_URL: z.string().default(""),
  JEV_API_KEY: z.string().default(""),
  JEV_MODEL: z.string().default("jev"),
  JEV_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.8),

  META_ACCESS_TOKEN: z.string().default(""),
  META_AD_ACCOUNT_ID: z.string().default(""),
  META_API_VERSION: z.string().default("v21.0"),
  META_MODE: z.enum(["simulated", "live"]).default("simulated"),

  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_WEBHOOK_SECRET: z.string().default(""),
  TELEGRAM_OWNER_ID: z.string().default(""),

  N8N_TRIGGER_SECRET: z.string().default(""),
  N8N_WEBHOOK_BASE: z.string().default(""),

  S3_ENDPOINT: z.string().default(""),
  S3_REGION: z.string().default("ap-southeast-1"),
  S3_BUCKET: z.string().default(""),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** Dibaca malas agar build tidak gagal saat env runtime belum lengkap. */
export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Konfigurasi env tidak valid: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export const isAiConfigured = () => Boolean(getEnv().AI_BASE_URL && getEnv().AI_API_KEY);
export const isJevConfigured = () => Boolean(getEnv().JEV_BASE_URL && getEnv().JEV_API_KEY);
export const isStorageConfigured = () => Boolean(getEnv().S3_ENDPOINT && getEnv().S3_BUCKET && getEnv().S3_ACCESS_KEY_ID);
export const isTelegramConfigured = () => Boolean(getEnv().TELEGRAM_BOT_TOKEN);
