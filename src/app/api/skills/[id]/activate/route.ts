import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agentSkillVersions, agentSkills } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

/** Aktifkan atau kembalikan versi skill (hanya pemilik). */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireOwner();
    const { id } = await context.params;
    const body = await readJson<{ versionId?: string; version?: number }>(request);

    const [skill] = await db.select().from(agentSkills).where(eq(agentSkills.key, id)).limit(1);
    if (!skill) return fail(404, "SKILL_NOT_FOUND", "Skill tidak ditemukan.");

    const versions = await db.select().from(agentSkillVersions).where(eq(agentSkillVersions.skillId, skill.id));
    const target = body.versionId
      ? versions.find((v) => v.id === body.versionId)
      : versions.find((v) => v.version === body.version);
    if (!target) return fail(404, "VERSION_NOT_FOUND", "Versi skill tidak ditemukan.");

    await db
      .update(agentSkills)
      .set({ activeVersionId: target.id, status: "active" })
      .where(eq(agentSkills.id, skill.id));

    await recordAudit({
      userId: user.id,
      action: "update",
      entityType: "agent_skills",
      entityId: skill.id,
      before: { activeVersionId: skill.activeVersionId },
      after: { activeVersionId: target.id, version: target.version },
    });

    return ok({ activeVersionId: target.id, version: target.version });
  });
}
