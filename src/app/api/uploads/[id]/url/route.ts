import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { apiHandler, fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { signDownload } from "@/services/storage/s3";

const EXPIRES_IN_SECONDS = 900;

/** URL bertanda tangan untuk memutar/mengunduh berkas (bucket privat). */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    await requireUser();
    const { id } = await context.params;
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "1";
    const filename = url.searchParams.get("filename") ?? undefined;

    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
    if (!upload) return fail(404, "UPLOAD_NOT_FOUND", "Berkas tidak ditemukan.");

    const signed = await signDownload(upload.storagePath, {
      expiresInSeconds: EXPIRES_IN_SECONDS,
      filename: download ? (filename ?? upload.storagePath.split("/").pop()) : undefined,
    });

    return ok({
      id: upload.id,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      url: signed,
      expiresInSeconds: EXPIRES_IN_SECONDS,
    });
  });
}
