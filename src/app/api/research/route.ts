import { db } from "@/db";
import { jobs, products } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { isKillSwitchActive } from "@/lib/settings";
import { recordAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { researchFormSchema } from "@/lib/riset-schema";
import { listResearchCandidates } from "@/lib/research-queries";
import { dispatchWorkflow } from "@/services/n8n/dispatch";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/** Ambil daftar kandidat produk (status=candidate, origin=research) beserta market brief & job terkini. */
export async function GET() {
  return apiHandler(async () => {
    await requireUser();
    const items = await listResearchCandidates();
    return ok({ items });
  });
}

/** Buat kandidat produk (status=candidate, origin=research) dan picu job research. */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();

    // Cek kill switch sebelum mutasi
    if (await isKillSwitchActive()) {
      return fail(409, "KILL_SWITCH_ACTIVE", "Kill switch aktif: riset dibatalkan.");
    }

    const parsed = researchFormSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return fail(400, "INVALID_BODY", "Data riset tidak valid.", {
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const { ownerContext, candidates: inputCandidates, suggestFromCategory } = parsed.data;

    // 1. Transaksi: insert products + insert job (tanpa panggil webhook)
    const result = await db.transaction(async (tx) => {
      // 1a. Buat produk kandidat dengan slug unik
      const productRows = [];
      for (const c of inputCandidates) {
        const baseSlug = slugify(c.name);
        const uniqueSlug = await generateUniqueSlug(tx, baseSlug);
        const [product] = await tx
          .insert(products)
          .values({
            name: c.name,
            slug: uniqueSlug,
            kind: ownerContext.productType,
            origin: "research" as const,
            status: "candidate" as const,
            context: {
              ownerContext,
              suggestFromCategory: suggestFromCategory ?? null,
              candidateNote: c.note ?? null,
            },
            createdBy: user.id,
          })
          .returning();
        productRows.push(product);
      }

      // 1b. Siapkan data candidates untuk webhook payload (A3)
      const webhookCandidates = productRows.map((p, idx) => ({
        id: p.id,
        name: inputCandidates[idx].name,
        note: inputCandidates[idx].note ?? null,
      }));

      // 1c. Buat job research
      const [job] = await tx
        .insert(jobs)
        .values({
          workflowKey: "research",
          trigger: "user",
          status: "queued",
          input: {
            productIds: productRows.map((p) => p.id),
            candidates: webhookCandidates,
            ownerContext,
            suggestFromCategory: suggestFromCategory ?? null,
          },
        })
        .returning();

      // 1d. Audit log untuk setiap produk
      for (const p of productRows) {
        await recordAudit({
          userId: user.id,
          action: "create",
          entityType: "products",
          entityId: p.id,
          after: { name: p.name, origin: p.origin, status: p.status },
        });
      }

      return { products: productRows, job, webhookCandidates };
    });

    // 2. Panggil webhook n8n DI LUAR transaksi (pakai helper dispatchWorkflow)
    const dispatchResult = await dispatchWorkflow({
      jobId: result.job.id,
      workflowKey: "research",
      input: {
        productIds: result.products.map((p) => p.id),
        candidates: result.webhookCandidates,
        ownerContext,
        suggestFromCategory: suggestFromCategory ?? null,
      },
    });

    // 3. Respons berdasarkan hasil dispatch
    if (!dispatchResult.ok) {
      // Produk dan job TETAP tersimpan, job status=failed sudah diupdate di dispatchWorkflow
      return fail(502, "N8N_TIDAK_TERJANGKAU", dispatchResult.error ?? "Gagal menghubungi n8n", {
        jobId: result.job.id,
        products: result.products.map((p) => ({ id: p.id, name: p.name })),
      });
    }

    // Sukses: job tetap queued, n8n akan callback running/succeeded
    return ok({ products: result.products, jobId: result.job.id }, { status: 201 });
  });
}

/** Generate slug unik dengan retry pada konflik unique constraint. */
async function generateUniqueSlug(tx: PostgresJsDatabase<typeof import("@/db/schema")>, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      // Cek apakah slug sudah ada
      const [existing] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (!existing) return slug;

      // Tambah sufiks acak 4 karakter
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${baseSlug}-${suffix}`;
      attempt++;
    } catch (e) {
      // Jika error unique constraint (kode Postgres 23505), coba lagi
      if (e instanceof Error && "code" in e && (e as { code?: string }).code === "23505") {
        const suffix = Math.random().toString(36).substring(2, 6);
        slug = `${baseSlug}-${suffix}`;
        attempt++;
        continue;
      }
      throw e;
    }
  }

  // Fallback: timestamp
  return `${baseSlug}-${Date.now().toString(36)}`;
}