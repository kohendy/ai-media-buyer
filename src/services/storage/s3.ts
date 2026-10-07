import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv, isStorageConfigured } from "@/lib/env";
import { StorageNotConfiguredError } from "@/lib/errors";

let client: S3Client | null = null;

/**
 * Lapisan storage tipis berbasis S3 (Neon Object Storage atau S3 lain).
 * Ganti penyedia cukup lewat env: endpoint, region, bucket, kredensial.
 */
export function getStorage(): S3Client | null {
  if (!isStorageConfigured()) return null;
  const env = getEnv();
  if (!client) {
    client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function putObject(key: string, body: Buffer | string, contentType: string) {
  const s3 = getStorage();
  if (!s3) throw new StorageNotConfiguredError();
  await s3.send(
    new PutObjectCommand({
      Bucket: getEnv().S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { bucket: getEnv().S3_BUCKET, storagePath: key };
}

export async function getObjectText(key: string): Promise<string> {
  const s3 = getStorage();
  if (!s3) throw new StorageNotConfiguredError();
  const result = await s3.send(new GetObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key }));
  return (await result.Body?.transformToString()) ?? "";
}

/** URL bertanda tangan berumur pendek untuk unduh/putar (bucket selalu privat). */
export async function signDownload(
  key: string,
  options: { expiresInSeconds?: number; filename?: string } = {},
): Promise<string> {
  const s3 = getStorage();
  if (!s3) throw new StorageNotConfiguredError();
  const command = new GetObjectCommand({
    Bucket: getEnv().S3_BUCKET,
    Key: key,
    ...(options.filename
      ? { ResponseContentDisposition: `attachment; filename="${options.filename}"` }
      : {}),
  });
  return getSignedUrl(s3, command, { expiresIn: options.expiresInSeconds ?? 900 });
}

/**
 * URL bertanda tangan untuk unggah langsung dari browser (PUT).
 * Dipakai untuk video/berkas besar agar tidak melewati batas body server.
 */
export async function signUpload(
  key: string,
  contentType: string,
  expiresInSeconds = 900,
): Promise<string> {
  const s3 = getStorage();
  if (!s3) throw new StorageNotConfiguredError();
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds },
  );
}

export async function deleteObject(key: string) {
  const s3 = getStorage();
  if (!s3) throw new StorageNotConfiguredError();
  await s3.send(new DeleteObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key }));
  return { bucket: getEnv().S3_BUCKET, storagePath: key };
}

/** Prefiks folder di bucket berdasarkan jenis berkas. */
export function storagePrefixFor(kind: string) {
  switch (kind) {
    case "asset":
      return "creative";
    case "landing_page":
      return "landing";
    case "screenshot":
      return "screenshot";
    case "export":
      return "export";
    default:
      return "document";
  }
}
