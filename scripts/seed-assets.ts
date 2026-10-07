import "../src/db/env-load";
import { deflateSync } from "node:zlib";
import { eq } from "drizzle-orm";
import { db, rawSql } from "../src/db";
import { uploads } from "../src/db/schema";
import { getEnv, isStorageConfigured } from "../src/lib/env";
import { putObject } from "../src/services/storage/s3";

/* ---------------- Pembuat PNG sederhana (placeholder creative) ---------------- */

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([length, typeBuf, data, crc]);
}

function makePng(
  size: number,
  pixel: (x: number, y: number) => [number, number, number, number],
): Buffer {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = pixel(x, y);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
      offset += 4;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const LANDING_HTML = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Garansi 30 Hari — Serum Vitamin C</title>
<style>
  body { margin:0; font-family: Inter, Arial, sans-serif; background:#FBF8F4; color:#1F2937; }
  main { max-width:640px; margin:0 auto; padding:48px 20px 64px; }
  h1 { font-size:34px; letter-spacing:-1px; margin:0 0 12px; }
  p { font-size:17px; line-height:1.6; color:#374151; }
  .cta { display:inline-block; margin-top:20px; background:#0E7490; color:#fff; padding:14px 22px; border-radius:12px; text-decoration:none; font-weight:600; }
</style>
</head>
<body>
<main>
  <h1>Kulit berminyak bukan berarti harus kusam.</h1>
  <p>Serum vitamin C 15% dengan tekstur ringan. Satu botol cukup untuk sebulan pemakaian.</p>
  <p>Garansi 30 hari: tidak cocok, uang kembali.</p>
  <a class="cta" href="#pesan">Pesan sekarang</a>
</main>
</body>
</html>
`;

async function main() {
  if (!isStorageConfigured()) {
    console.error("Penyimpanan belum dikonfigurasi. Isi S3_* di .env.local.");
    process.exit(1);
  }

  const env = getEnv();
  const targets = [
    {
      key: "creative/contoh-hook1.png",
      mime: "image/png",
      body: makePng(256, (x, y) => {
        const stripe = (x + y) % 40 < 20 ? 0 : 22;
        return [14 + stripe, 116 + stripe, 108 + stripe, 255] as [number, number, number, number];
      }),
    },
    {
      key: "landing/contoh-garansi-30-hari.html",
      mime: "text/html; charset=utf-8",
      body: Buffer.from(LANDING_HTML, "utf8"),
    },
  ];

  for (const target of targets) {
    await putObject(target.key, target.body, target.mime);
    const updated = await db
      .update(uploads)
      .set({ mimeType: target.mime, sizeBytes: target.body.length })
      .where(eq(uploads.storagePath, target.key))
      .returning();
    console.log(
      `unggah ${target.key} (${target.body.length} byte) · baris uploads diperbarui: ${updated.length}`,
    );
  }

  console.log(`Bucket: ${env.S3_BUCKET}`);
}

main()
  .catch((error) => {
    console.error("Gagal menanam aset contoh:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await rawSql.end({ timeout: 5 });
  });
