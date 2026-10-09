import { Bot } from "grammy";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { approvals, jobs, products, users } from "@/db/schema";
import { createLoginLink } from "@/lib/auth";
import { getEnv, isTelegramConfigured } from "@/lib/env";
import { getActiveProductId, isKillSwitchActive, setKillSwitch } from "@/lib/settings";
import { slugify } from "@/lib/slug";
import { dispatchWorkflow } from "@/services/n8n/dispatch";

let bot: Bot | null = null;

async function findUser(telegramUserId: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramUserId, telegramUserId))
    .limit(1);
  return user && user.isActive ? user : null;
}

function registerHandlers(instance: Bot) {
  instance.command("start", async (ctx) => {
    const user = await findUser(ctx.from?.id ?? 0);
    await ctx.reply(
      user
        ? `Halo ${user.name}. Kamu terdaftar (${user.role}). Ketik /bantuan untuk daftar perintah.`
        : "Maaf, akun ini belum terdaftar di daftar putih. Minta pemilik menambahkan ID Telegram-mu.",
    );
  });

  instance.command("login", async (ctx) => {
    const user = await findUser(ctx.from?.id ?? 0);
    if (!user) return ctx.reply("Akun ini tidak terdaftar.");
    const link = await createLoginLink(user.id, 5);
    await ctx.reply(`Tautan masuk (sekali pakai, berlaku 5 menit):\n${link.url}`);
  });

  instance.command("ringkasan", async (ctx) => {
    const [pending, kill] = await Promise.all([db.select().from(approvals), isKillSwitchActive()]);
    const menunggu = pending.filter((row) => row.status === "pending").length;
    await ctx.reply(
      `Ringkasan hari ini\n• Menunggu approval: ${menunggu}\n• Kill switch: ${kill ? "AKTIF" : "tidak aktif"}`,
    );
  });

  instance.command("approval", async (ctx) => {
    const rows = (await db.select().from(approvals)).filter((row) => row.status === "pending").slice(0, 10);
    if (rows.length === 0) return ctx.reply("Tidak ada item menunggu persetujuan.");
    await ctx.reply(rows.map((row, index) => `${index + 1}. ${row.title}`).join("\n"));
  });

  instance.command("kampanye", async (ctx) => {
    await ctx.reply("Buka dashboard → Kampanye untuk status Meta terkini.");
  });

  instance.command("laporan", async (ctx) => {
    await ctx.reply("Laporan harian terbaru tersedia di dashboard → Laporan.");
  });

  instance.command("biaya", async (ctx) => {
    const env = getEnv();
    await ctx.reply(`Batas AI: ${env.AI_DAILY_CALL_CAP} panggilan/hari · Rp ${env.AI_MONTHLY_BUDGET_IDR.toLocaleString("id-ID")}/bulan.`);
  });

  instance.command("stop", async (ctx) => {
    const user = await findUser(ctx.from?.id ?? 0);
    if (!user) return ctx.reply("Akun ini tidak terdaftar.");
    await setKillSwitch(true, user.id);
    await ctx.reply("Kill switch AKTIF. Semua aksi tulis dihentikan dan persetujuan terkunci.");
  });

  instance.command("lanjut", async (ctx) => {
    const user = await findUser(ctx.from?.id ?? 0);
    if (!user) return ctx.reply("Akun ini tidak terdaftar.");
    if (user.role !== "owner") return ctx.reply("Hanya pemilik yang dapat menonaktifkan kill switch.");
    await setKillSwitch(false, user.id);
    await ctx.reply("Kill switch dimatikan. Aksi otomatis dilanjutkan.");
  });

  instance.command("riset", async (ctx) => {
    const produk = ctx.match?.toString().trim();
    if (!produk) {
      return ctx.reply(
        "Contoh: /riset kue kering premium\n\n" +
        "Ini akan membuat kandidat produk dan memulai job riset."
      );
    }

    const user = await findUser(ctx.from?.id ?? 0);
    if (!user) return ctx.reply("Akun ini tidak terdaftar.");

    // Cek kill switch
    if (await isKillSwitchActive()) {
      return ctx.reply("Kill switch aktif: riset dibatalkan.");
    }

    try {
      const tgUserId = user.telegramUserId ?? 0;
      // Ambil konteks pemilik dari job riset terakhir user (jika ada)
      const [lastJob] = await db
        .select()
        .from(jobs)
        .where(
          and(
            eq(jobs.workflowKey, "research"),
            eq(jobs.trigger, "user"),
            sql`${jobs.input}->>'telegramUserId' = ${tgUserId.toString()}`
          )
        )
        .orderBy(desc(jobs.createdAt))
        .limit(1);

      const lastInput = lastJob?.input as Record<string, unknown> | null;
      const ownerContext = lastInput?.ownerContext as Record<string, unknown> | null;

      // Buat produk kandidat dengan slug unik
      const baseSlug = slugify(produk);
      let slug = baseSlug;
      let attempt = 0;
      while (attempt < 3) {
        const [existing] = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.slug, slug))
          .limit(1);
        if (!existing) break;
        const suffix = Math.random().toString(36).substring(2, 6);
        slug = `${baseSlug}-${suffix}`;
        attempt++;
      }
      if (attempt >= 3) slug = `${baseSlug}-${Date.now().toString(36)}`;

      // Buat produk kandidat
      const [product] = await db
        .insert(products)
        .values({
          name: produk,
          slug,
          kind: "other",
          origin: "research",
          status: "candidate",
          context: { telegramUserId: tgUserId, source: "telegram" },
          createdBy: user.id,
        })
        .returning();

      // Siapkan ownerContext untuk job (pakai yang terakhir atau default)
      const jobOwnerContext = ownerContext ?? {
        productType: "other",
        location: "Indonesia",
        capitalIdr: 0,
        minMarginPct: 0,
        productionCapability: "Via Telegram",
      };

      // Buat job research
      const [job] = await db
        .insert(jobs)
        .values({
          workflowKey: "research",
          trigger: "user",
          status: "queued",
          input: {
            productIds: [product.id],
            candidates: [{ id: product.id, name: produk, note: null }],
            ownerContext: jobOwnerContext,
            suggestFromCategory: null,
            telegramUserId: tgUserId,
          },
        })
        .returning();

      // Dispatch ke n8n pakai helper (await, bukan fire-and-forget)
      const dispatchResult = await dispatchWorkflow({
        jobId: job.id,
        workflowKey: "research",
        input: {
          productIds: [product.id],
          candidates: [{ id: product.id, name: produk, note: null }],
          ownerContext: jobOwnerContext,
          suggestFromCategory: null,
        },
      });

      if (!dispatchResult.ok) {
        // Job sudah diupdate ke failed di dispatchWorkflow
        await ctx.reply(`Riset gagal: ${dispatchResult.error}`);
        return;
      }

      await ctx.reply(
        `Riset dimulai untuk: ${produk}\n` +
        `Job ID: ${job.id}\n` +
        `Produk ID: ${product.id}\n\n` +
        `Cek status di dashboard → Riset Pasar atau tunggu notifikasi selesai.`
      );
    } catch (e) {
      console.error("[telegram] riset error:", e);
      await ctx.reply("Gagal memulai riset. Coba lagi nanti.");
    }
  });

  instance.command("brief", async (ctx) => {
    await ctx.reply("Jawab singkat: nama produk, harga, target pembeli, 3 kelebihan, masalah utama.");
  });

  instance.command("kompetitor", async (ctx) => {
    await ctx.reply("Kirim nama brand, kata kunci, URL Ad Library, atau tangkapan iklan.");
  });

  instance.command("creative", async (ctx) => {
    const angle = ctx.match?.toString().trim() || "bukti sosial";
    await ctx.reply(`Paket creative diminta untuk angle: ${angle}`);
  });

  instance.command("bantuan", async (ctx) => {
    const product = await getActiveProductId();
    await ctx.reply(
      [
        "Perintah:",
        "/login /ringkasan /approval /kampanye /riset /brief /kompetitor /creative /laporan /biaya /stop /lanjut",
        `Produk aktif: ${product ?? "-"}`,
      ].join("\n"),
    );
  });

  instance.on("message:text", async (ctx) => {
    const user = await findUser(ctx.from?.id ?? 0);
    if (!user) return;
    await ctx.reply("Pesan diterima. Bila maksudnya belum jelas, bot akan meminta konfirmasi.");
  });
}

/** Bot dibuat malas; null bila token belum diisi. */
export function getBot(): Bot | null {
  if (!isTelegramConfigured()) return null;
  if (!bot) {
    bot = new Bot(getEnv().TELEGRAM_BOT_TOKEN);
    registerHandlers(bot);
  }
  return bot;
}

/** Inisialisasi bot (dipanggil sekali saat startup/webhook). */
export async function initBot(): Promise<Bot | null> {
  const b = getBot();
  if (b) await b.init();
  return b;
}