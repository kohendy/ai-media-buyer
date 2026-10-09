import { db } from "@/db";
import { telegramUpdates } from "@/db/schema";
import { apiHandler, fail, header, ok } from "@/lib/api";
import { safeEqual } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { initBot } from "@/services/telegram/bot";

/**
 * Webhook Telegram: diverifikasi dengan secret token, `update_id` diproses sekali,
 * lalu diteruskan ke grammY.
 */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const env = getEnv();
    const secret = header(request, "x-telegram-bot-api-secret-token");
    if (!env.TELEGRAM_WEBHOOK_SECRET || !secret || !safeEqual(secret, env.TELEGRAM_WEBHOOK_SECRET)) {
      return fail(401, "UNAUTHORIZED", "Secret webhook Telegram tidak valid.");
    }

    const update = (await request.json()) as { update_id?: number };
    if (typeof update.update_id !== "number") {
      return fail(400, "INVALID_UPDATE", "update_id tidak ditemukan.");
    }

    // Cegah pemrosesan ganda.
    const inserted = await db
      .insert(telegramUpdates)
      .values({ updateId: update.update_id })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0) return ok({ skipped: true });

    const bot = await initBot();
    if (!bot) return fail(503, "BOT_NOT_CONFIGURED", "TELEGRAM_BOT_TOKEN belum diisi.");

    // Proses update dan tunggu selesai (tidak fire-and-forget)
    await bot.handleUpdate(update as never).catch((error) => {
      console.error("[telegram]", error instanceof Error ? error.message : error);
    });

    return ok({ accepted: true });
  });
}