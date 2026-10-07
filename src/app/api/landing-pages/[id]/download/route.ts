import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { landingPages, uploads } from "@/db/schema";
import { apiHandler, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";

/** Unduh berkas HTML bersih (tanpa skrip preview). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    await requireUser();
    const { id } = await context.params;

    const [page] = await db.select().from(landingPages).where(eq(landingPages.id, id)).orderBy(desc(landingPages.version)).limit(1);
    if (!page) return fail(404, "PAGE_NOT_FOUND", "Landing page tidak ditemukan.");

    const html = page.html ?? (page.fileUploadId ? await loadFromStorage(page.fileUploadId) : defaultHtml(page.title));

    return new Response(stripPreviewHooks(html), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `attachment; filename="${page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html"`,
      },
    });
  });
}

async function loadFromStorage(uploadId: string) {
  const [upload] = await db.select().from(uploads).where(eq(uploads.id, uploadId)).limit(1);
  if (!upload) return defaultHtml("Landing page");
  const { getObjectText } = await import("@/services/storage/s3");
  return getObjectText(upload.storagePath);
}

function stripPreviewHooks(html: string) {
  return html.replace(/<script[^>]*data-preview-hook[\s\S]*?<\/script>/gi, "");
}

function defaultHtml(title: string) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body><main style="font-family:Arial,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#1f2937"><h1 style="letter-spacing:-.8px">${title}</h1><p>Contoh berkas HTML mandiri.</p></main></body></html>`;
}
