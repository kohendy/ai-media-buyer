import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rules } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const bodySchema = z.object({
  key: z.enum(["hard_caps", "scale", "pause", "fatigue", "new_creative"]),
  params: z.record(z.string(), z.unknown()),
  mode: z.enum(["suggest_approve", "auto"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  return apiHandler(async () => {
    await requireOwner();
    return ok({ rules: await db.select().from(rules) });
  });
}

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    const user = await requireOwner();
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(400, "INVALID_BODY", "Aturan tidak valid.");

    const [existing] = await db.select().from(rules).where(eq(rules.key, parsed.data.key)).limit(1);

    const [row] = await db
      .insert(rules)
      .values({
        key: parsed.data.key,
        params: parsed.data.params,
        mode: parsed.data.mode ?? existing?.mode ?? "suggest_approve",
        isActive: parsed.data.isActive ?? existing?.isActive ?? true,
        version: (existing?.version ?? 0) + 1,
        updatedBy: user.id,
      })
      .onConflictDoNothing()
      .returning();

    let saved = row;
    if (!saved && existing) {
      const [updated] = await db
        .update(rules)
        .set({
          params: parsed.data.params,
          mode: parsed.data.mode ?? existing.mode,
          isActive: parsed.data.isActive ?? existing.isActive,
          version: existing.version + 1,
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(rules.id, existing.id))
        .returning();
      saved = updated;
    }

    await recordAudit({
      userId: user.id,
      action: "update",
      entityType: "rules",
      entityId: saved?.id ?? null,
      before: existing ? { params: existing.params, mode: existing.mode } : null,
      after: { params: saved?.params, mode: saved?.mode },
    });

    return ok({ rule: saved });
  });
}
