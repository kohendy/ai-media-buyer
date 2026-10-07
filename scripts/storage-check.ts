import "../src/db/env-load";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, rawSql } from "../src/db";
import { uploads } from "../src/db/schema";
import { getEnv, isStorageConfigured } from "../src/lib/env";
import {
  deleteObject,
  getObjectText,
  putObject,
  signDownload,
  signUpload,
  storagePrefixFor,
} from "../src/services/storage/s3";

/**
 * Verifikasi Neon Object Storage end-to-end:
 * unggah langsung, baca kembali, URL bertanda tangan, dan jalur unggah presigned
 * (yang dipakai untuk video iklan), lalu bersihkan objek uji.
 */
async function main() {
  if (!isStorageConfigured()) {
    console.error("Penyimpanan belum dikonfigurasi. Isi S3_* di .env.local.");
    process.exit(1);
  }

  const env = getEnv();
  console.log(`Bucket: ${env.S3_BUCKET} · region ${env.S3_REGION}`);
  console.log(`Endpoint: ${env.S3_ENDPOINT}`);

  const stamp = new Date().toISOString().slice(0, 10);
  const textKey = `${storagePrefixFor("document")}/${stamp}/check-${randomUUID()}.txt`;
  const videoKey = `${storagePrefixFor("asset")}/${stamp}/check-${randomUUID()}.mp4`;

  await putObject(textKey, "Halo dari AI Media Buyer", "text/plain; charset=utf-8");
  console.log("1) putObject        :", textKey);

  const back = await getObjectText(textKey);
  console.log("2) getObject        :", JSON.stringify(back));

  const dl = await signDownload(textKey, { expiresInSeconds: 300, filename: "bukti.txt" });
  const dlRes = await fetch(dl);
  console.log("3) signDownload GET :", dlRes.status, JSON.stringify(await dlRes.text()));

  const uploadUrl = await signUpload(videoKey, "video/mp4", 300);
  const payload = Buffer.alloc(64 * 1024, 7);
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": "video/mp4" },
    body: payload,
  });
  console.log("4) presign PUT      :", putRes.status);

  const playUrl = await signDownload(videoKey, { expiresInSeconds: 300 });
  const play = await fetch(playUrl);
  console.log("5) signed GET       :", play.status, `${(await play.arrayBuffer()).byteLength} byte`);

  const [row] = await db
    .insert(uploads)
    .values({
      kind: "document",
      bucket: env.S3_BUCKET,
      storagePath: textKey,
      mimeType: "text/plain",
      sizeBytes: Buffer.byteLength(back),
    })
    .returning();
  console.log("6) baris uploads    :", row.id);

  await deleteObject(textKey);
  await deleteObject(videoKey);
  await db.delete(uploads).where(eq(uploads.id, row.id));
  console.log("7) bersih           : objek uji dihapus");
}

main()
  .catch((error) => {
    console.error("Uji storage gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await rawSql.end({ timeout: 5 });
  });
