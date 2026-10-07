import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creatives, landingPages } from "@/db/schema";
import { apiHandler, fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { isStorageConfigured } from "@/lib/env";

/**
 * Sumber preview: peta blok, daftar versi, dan (bila ada) URL bertanda tangan.
 * Untuk landing page, HTML dikirim agar dapat ditampilkan dalam iframe ber-sandbox.
 */
export async function GET(_request: Request, context: { params: Promise<{ subjectType: string; id: string }> }) {
  return apiHandler(async () => {
    await requireUser();
    const { subjectType, id } = await context.params;

    if (subjectType === "landing_page") {
      const rows = await db
        .select()
        .from(landingPages)
        .where(eq(landingPages.id, id))
        .orderBy(asc(landingPages.version));
      const page = rows.find((row) => row.id === id) ?? rows[rows.length - 1];
      if (!page) return fail(404, "PAGE_NOT_FOUND", "Landing page tidak ditemukan.");
      return ok({
        subjectType,
        id,
        version: page.version,
        title: page.title,
        status: page.status,
        blocks: page.blocks,
        precheck: page.precheck,
        html: page.html,
        versions: rows.map((row) => ({ id: row.id, version: row.version, status: row.status, createdAt: row.createdAt })),
      });
    }

    if (subjectType === "creative") {
      const rows = await db.select().from(creatives).where(eq(creatives.id, id)).orderBy(asc(creatives.version));
      const creative = rows.find((row) => row.id === id) ?? rows[rows.length - 1];
      if (!creative) return fail(404, "CREATIVE_NOT_FOUND", "Creative tidak ditemukan.");
      return ok({
        subjectType,
        id,
        version: creative.version,
        name: creative.name,
        status: creative.status,
        format: creative.format,
        primaryText: creative.primaryText,
        headline: creative.headline,
        description: creative.description,
        cta: creative.cta,
        precheck: creative.precheck,
        storageReady: isStorageConfigured(),
        versions: rows.map((row) => ({ id: row.id, version: row.version, status: row.status, createdAt: row.createdAt })),
      });
    }

    return fail(400, "INVALID_SUBJECT", "subjectType harus landing_page atau creative.");
  });
}
