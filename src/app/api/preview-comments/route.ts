import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { previewComments } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";

const createSchema = z.object({
  subjectType: z.enum(["landing_page", "creative"]),
  subjectId: z.string().uuid(),
  kind: z.enum(["change", "replace_text", "question"]),
  anchorType: z.enum(["block", "text_range", "image_area", "video_time", "general"]),
  anchor: z.record(z.string(), z.unknown()).default({}),
  anchorSnapshot: z.string().max(500).optional(),
  body: z.string().min(1).max(2000),
  replacementText: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  return apiHandler(async () => {
    await requireUser();
    const url = new URL(request.url);
    const subjectType = url.searchParams.get("subject_type");
    const subjectId = url.searchParams.get("subject_id");
    if (!subjectType || !subjectId) {
      return fail(400, "QUERY_REQUIRED", "subject_type dan subject_id wajib diisi.");
    }
    const rows = await db
      .select()
      .from(previewComments)
      .where(
        and(
          eq(previewComments.subjectType, subjectType as "landing_page" | "creative"),
          eq(previewComments.subjectId, subjectId),
        ),
      )
      .orderBy(asc(previewComments.createdAt));
    return ok({ items: rows });
  });
}

/** Buat komentar preview (posisi, jenis, isi). */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const parsed = createSchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Komentar tidak valid.");

    const [row] = await db
      .insert(previewComments)
      .values({ ...parsed.data, createdBy: user.id })
      .returning();

    return ok({ comment: row }, { status: 201 });
  });
}
