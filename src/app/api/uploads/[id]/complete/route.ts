import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { creativeAssets, uploads } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const bodySchema = z.object({
  sizeBytes: z.number().int().nonnegative().optional(),
  fileHash: z.string().max(128).optional(),
  /** Bila diisi, berkas langsung ditautkan sebagai aset creative. */
  creativeId: z.string().uuid().optional(),
  assetKind: z.enum(["image", "video", "thumbnail"]).optional(),
  aspectRatio: z.string().max(12).optional(),
  durationSec: z.number().int().nonnegative().optional(),
  provider: z.string().max(80).optional(),
  prompt: z.string().max(2000).optional(),
});

function inferAssetKind(mimeType: string): "image" | "video" | "thumbnail" {
  if (mimeType.startsWith("video/")) return "video";
  return "image";
}

/** Tandai unggahan selesai; opsional tautkan sebagai aset creative. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Data penyelesaian unggahan tidak valid.");

    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
    if (!upload) return fail(404, "UPLOAD_NOT_FOUND", "Berkas tidak ditemukan.");

    const { creativeId, assetKind, aspectRatio, durationSec, provider, prompt, ...rest } = parsed.data;

    if (rest.sizeBytes !== undefined || rest.fileHash !== undefined) {
      await db.update(uploads).set(rest).where(eq(uploads.id, id));
    }

    let asset = null;
    if (creativeId) {
      const [row] = await db
        .insert(creativeAssets)
        .values({
          creativeId,
          kind: assetKind ?? inferAssetKind(upload.mimeType),
          source: "uploaded",
          uploadId: upload.id,
          aspectRatio: aspectRatio ?? "1:1",
          durationSec,
          provider,
          prompt,
        })
        .returning();
      asset = row;
    }

    await recordAudit({
      userId: user.id,
      action: "update",
      entityType: "uploads",
      entityId: upload.id,
      before: { sizeBytes: upload.sizeBytes },
      after: { sizeBytes: rest.sizeBytes ?? upload.sizeBytes, attachedTo: creativeId ?? null },
    });

    return ok({ uploadId: upload.id, storagePath: upload.storagePath, asset });
  });
}
