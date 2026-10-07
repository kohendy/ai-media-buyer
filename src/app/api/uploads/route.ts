import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { apiHandler, fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getEnv, isStorageConfigured } from "@/lib/env";
import { putObject, storagePrefixFor } from "@/services/storage/s3";

const KINDS = ["asset", "landing_page", "screenshot", "document", "export"] as const;
type UploadKind = (typeof KINDS)[number];

function normalizeKind(value: string | null): UploadKind {
  return (KINDS as readonly string[]).includes(value ?? "") ? (value as UploadKind) : "asset";
}

/** Daftar berkas tersimpan, opsional disaring per jenis. */
export async function GET(request: Request) {
  return apiHandler(async () => {
    await requireUser();
    const kind = new URL(request.url).searchParams.get("kind");
    const rows = kind
      ? await db
          .select()
          .from(uploads)
          .where(eq(uploads.kind, normalizeKind(kind)))
          .orderBy(desc(uploads.createdAt))
          .limit(100)
      : await db.select().from(uploads).orderBy(desc(uploads.createdAt)).limit(100);

    return ok({
      items: rows,
      storage: { configured: isStorageConfigured(), bucket: getEnv().S3_BUCKET },
    });
  });
}

/**
 * Unggah berkas langsung ke server (cocok untuk gambar/screenshot kecil).
 * Untuk video atau berkas besar, pakai `POST /api/uploads/presign` agar
 * berkas dikirim langsung ke bucket tanpa melewati batas body server.
 */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    if (!isStorageConfigured()) {
      return fail(503, "STORAGE_NOT_CONFIGURED", "Penyimpanan objek belum dikonfigurasi.");
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail(400, "FILE_REQUIRED", "Lampirkan berkas pada field 'file'.");
    }

    const body = Buffer.from(await file.arrayBuffer());
    if (body.byteLength > 25 * 1024 * 1024) {
      return fail(413, "FILE_TOO_LARGE", "Berkas melebihi 25 MB. Gunakan unggah langsung (presign).");
    }

    const kind = normalizeKind(String(form.get("kind") ?? "asset"));
    const contentType = file.type || "application/octet-stream";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "berkas";
    const key = `${storagePrefixFor(kind)}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}-${safeName}`;

    await putObject(key, body, contentType);

    const [row] = await db
      .insert(uploads)
      .values({
        kind,
        bucket: getEnv().S3_BUCKET,
        storagePath: key,
        mimeType: contentType,
        sizeBytes: body.byteLength,
        createdBy: user.id,
      })
      .returning();

    return ok({ upload: row }, { status: 201 });
  });
}
