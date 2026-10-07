import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getEnv, isStorageConfigured } from "@/lib/env";
import { signUpload, storagePrefixFor } from "@/services/storage/s3";

const bodySchema = z.object({
  kind: z.enum(["asset", "landing_page", "screenshot", "document", "export"]).default("asset"),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative().optional(),
});

const EXPIRES_IN_SECONDS = 900;

/**
 * Minta URL unggah bertanda tangan (PUT). Browser mengirim berkas langsung ke
 * bucket, sehingga video berukuran besar tidak melewati server aplikasi.
 * Setelah selesai, panggil `POST /api/uploads/{id}/complete`.
 */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    if (!isStorageConfigured()) {
      return fail(503, "STORAGE_NOT_CONFIGURED", "Penyimpanan objek belum dikonfigurasi.");
    }

    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Permintaan unggah tidak valid.");

    const { kind, filename, contentType, sizeBytes } = parsed.data;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "berkas";
    const key = `${storagePrefixFor(kind)}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}-${safeName}`;

    const uploadUrl = await signUpload(key, contentType, EXPIRES_IN_SECONDS);

    const [row] = await db
      .insert(uploads)
      .values({
        kind,
        bucket: getEnv().S3_BUCKET,
        storagePath: key,
        mimeType: contentType,
        sizeBytes: sizeBytes ?? 0,
        createdBy: user.id,
      })
      .returning();

    return ok(
      {
        uploadId: row.id,
        bucket: getEnv().S3_BUCKET,
        storagePath: key,
        uploadUrl,
        method: "PUT",
        headers: { "content-type": contentType },
        expiresInSeconds: EXPIRES_IN_SECONDS,
      },
      { status: 201 },
    );
  });
}
