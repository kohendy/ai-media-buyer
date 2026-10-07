import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentSkillVersions, agentSkills } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    await requireUser();
    const { id } = await context.params;
    const [skill] = await db.select().from(agentSkills).where(eq(agentSkills.key, id)).limit(1);
    if (!skill) return fail(404, "SKILL_NOT_FOUND", "Skill tidak ditemukan.");
    const versions = await db
      .select()
      .from(agentSkillVersions)
      .where(eq(agentSkillVersions.skillId, skill.id))
      .orderBy(desc(agentSkillVersions.version));
    return ok({ skill, versions });
  });
}

/** Simpan perubahan sebagai versi draf baru (tidak menimpa versi lama). */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const [skill] = await db.select().from(agentSkills).where(eq(agentSkills.key, id)).limit(1);
    if (!skill) return fail(404, "SKILL_NOT_FOUND", "Skill tidak ditemukan.");

    const body = await readJson<{
      instructionsMd?: string;
      examples?: Record<string, unknown>;
      resources?: string[];
      changeNote?: string;
      modelTier?: "main" | "light";
    }>(request);

    const versions = await db.select().from(agentSkillVersions).where(eq(agentSkillVersions.skillId, skill.id));
    const nextVersion = Math.max(0, ...versions.map((v) => v.version)) + 1;

    const [version] = await db
      .insert(agentSkillVersions)
      .values({
        skillId: skill.id,
        version: nextVersion,
        instructionsMd: body.instructionsMd ?? "",
        examples: body.examples ?? {},
        resources: body.resources ?? [],
        changeNote: body.changeNote ?? `Draff v${nextVersion}`,
        createdBy: user.id,
      })
      .returning();

    if (body.modelTier) {
      await db.update(agentSkills).set({ modelTier: body.modelTier }).where(eq(agentSkills.id, skill.id));
    }

    return ok({ version }, { status: 201 });
  });
}
