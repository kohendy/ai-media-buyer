import { db } from "@/db";
import { jobs, marketBriefs, products } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { isKillSwitchActive } from "@/lib/settings";
import { recordAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { researchFormSchema } from "@/lib/riset-schema";
import { desc, eq } from "drizzle-orm";

/** Ambil daftar kandidat produk (status=candidate, origin=research) beserta market brief & job terkini. */
export async function GET() {
  return apiHandler(async () => {
    await requireUser();

    const candidates = await db
      .select({
        id: products.id,
        name: products.name,
        kind: products.kind,
        score: products.score,
        confidence: products.confidence,
        context: products.context,
        createdAt: products.createdAt,
        marketBrief: {
          id: marketBriefs.id,
          demandSummary: marketBriefs.demandSummary,
          priceMin: marketBriefs.priceMin,
          priceMax: marketBriefs.priceMax,
          version: marketBriefs.version,
          createdAt: marketBriefs.createdAt,
        },
        latestJob: {
          id: jobs.id,
          status: jobs.status,
          error: jobs.error,
          createdAt: jobs.createdAt,
        },
      })
      .from(products)
      .leftJoin(marketBriefs, eq(marketBriefs.productId, products.id))
      .leftJoin(jobs, eq(jobs.workflowKey, "research"))
      .where(eq(products.origin, "research"))
      .orderBy(desc(products.createdAt));

    // Gabungkan job per produk (ambil job terbaru per produk)
    const jobsByProduct = await db
      .select()
      .from(jobs)
      .where(eq(jobs.workflowKey, "research"))
      .orderBy(desc(jobs.createdAt));

    const jobMap = new Map<string, typeof jobsByProduct[0]>();
    for (const job of jobsByProduct) {
      const input = job.input as Record<string, unknown> | null;
      const productIds = (input?.productIds as string[]) ?? [];
      for (const pid of productIds) {
        if (!jobMap.has(pid)) jobMap.set(pid, job);
      }
    }

    const items = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      score: c.score ? Number(c.score) : null,
      confidence: c.confidence ? Number(c.confidence) * 100 : null,
      context: c.context as Record<string, unknown> | null,
      marketBrief: c.marketBrief?.id ? c.marketBrief : null,
      latestJob: jobMap.get(c.id) ?? null,
    }));

    return ok({ items });
  });
}

/** Buat kandidat produk (status=candidate, origin=research) dan picu job research dalam 1 transaksi. */
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

    const { ownerContext, candidates, suggestFromCategory } = parsed.data;
    const env = getEnv();

    // Transaksi: insert products + insert job
    const result = await db.transaction(async (tx) => {
      // 1. Buat produk kandidat
      const productRows = await tx
        .insert(products)
        .values(
          candidates.map((c) => ({
            name: c.name,
            slug: slugify(c.name),
            kind: ownerContext.productType,
            origin: "research" as const,
            status: "candidate" as const,
            context: {
              ownerContext,
              suggestFromCategory: suggestFromCategory ?? null,
              candidateNote: c.note ?? null,
            },
            createdBy: user.id,
          }))
        )
        .returning();

      // 2. Buat job research
      const [job] = await tx
        .insert(jobs)
        .values({
          workflowKey: "research",
          trigger: "user",
          status: "queued",
          input: {
            productIds: productRows.map((p) => p.id),
            ownerContext,
            suggestFromCategory: suggestFromCategory ?? null,
          },
        })
        .returning();

      // 3. Panggil webhook n8n (non-blocking, tapi catat error ke job)
      if (env.N8N_WEBHOOK_BASE) {
        try {
          await fetch(`${env.N8N_WEBHOOK_BASE.replace(/\/$/, "")}/research`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-n8n-secret": env.N8N_TRIGGER_SECRET },
            body: JSON.stringify({ jobId: job.id, input: { productIds: productRows.map((p) => p.id), ownerContext } }),
          });
        } catch (e) {
          await tx.update(jobs).set({ status: "failed", error: "Gagal memicu webhook n8n." }).where(eq(jobs.id, job.id));
          throw e; // rollback transaksi
        }
      } else {
        await tx.update(jobs).set({ status: "failed", error: "N8N_WEBHOOK_BASE belum diisi" }).where(eq(jobs.id, job.id));
        throw new Error("N8N_WEBHOOK_BASE belum diisi");
      }

      // 4. Audit log untuk setiap produk
      for (const p of productRows) {
        await recordAudit({
          userId: user.id,
          action: "create",
          entityType: "products",
          entityId: p.id,
          after: { name: p.name, origin: p.origin, status: p.status },
        });
      }

      return { products: productRows, job };
    });

    return ok({ products: result.products, jobId: result.job.id }, { status: 201 });
  });
}