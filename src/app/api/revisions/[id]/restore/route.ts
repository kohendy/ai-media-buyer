import { eq } from "drizzle-orm";
import { db } from "@/db";
import { creatives, landingPages, revisionRequests } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

/**
 * Kembalikan versi lama sebagai versi aktif.
 * Revisi tidak menimpa data: versi lama disalin menjadi baris baru dengan `previousId`.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireOwner();
    const { id } = await context.params;
    const body = await readJson<{ versionId?: string }>(request);

    const [revision] = await db.select().from(revisionRequests).where(eq(revisionRequests.id, id)).limit(1);
    if (!revision) return fail(404, "REVISION_NOT_FOUND", "Permintaan revisi tidak ditemukan.");

    const targetId = body.versionId ?? revision.baseId;

    if (revision.subjectType === "landing_page") {
      const [base] = await db.select().from(landingPages).where(eq(landingPages.id, targetId)).limit(1);
      if (!base) return fail(404, "PAGE_NOT_FOUND", "Versi landing page tidak ditemukan.");
      const siblings = await db.select().from(landingPages).where(eq(landingPages.angleId, base.angleId));
      const nextVersion = Math.max(0, ...siblings.map((row) => row.version)) + 1;

      const [restored] = await db
        .insert(landingPages)
        .values({
          productId: base.productId,
          angleId: base.angleId,
          version: nextVersion,
          previousId: base.id,
          title: base.title,
          blocks: base.blocks,
          insightIds: base.insightIds,
          html: base.html,
          fileUploadId: base.fileUploadId,
          sizeKb: base.sizeKb,
          precheck: base.precheck,
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      await recordAudit({
        userId: user.id,
        action: "update",
        entityType: "landing_pages",
        entityId: restored.id,
        before: { restoredFrom: base.id },
        after: { version: restored.version, status: restored.status },
      });

      return ok({ restored });
    }

    const [base] = await db.select().from(creatives).where(eq(creatives.id, targetId)).limit(1);
    if (!base) return fail(404, "CREATIVE_NOT_FOUND", "Versi creative tidak ditemukan.");
    const siblings = await db.select().from(creatives).where(eq(creatives.angleId, base.angleId));
    const nextVersion = Math.max(0, ...siblings.map((row) => row.version)) + 1;

    const [restored] = await db
      .insert(creatives)
      .values({
        productId: base.productId,
        angleId: base.angleId,
        name: base.name,
        format: base.format,
        primaryText: base.primaryText,
        headline: base.headline,
        description: base.description,
        cta: base.cta,
        landingPageId: base.landingPageId,
        version: nextVersion,
        previousId: base.id,
        precheck: base.precheck,
        status: "draft",
      })
      .returning();

    await recordAudit({
      userId: user.id,
      action: "update",
      entityType: "creatives",
      entityId: restored.id,
      before: { restoredFrom: base.id },
      after: { version: restored.version, status: restored.status },
    });

    return ok({ restored });
  });
}
