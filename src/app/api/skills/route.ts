import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agentSkillVersions, agentSkills } from "@/db/schema";
import { apiHandler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  return apiHandler(async () => {
    await requireUser();
    const skills = await db.select().from(agentSkills);
    const versions = await db.select().from(agentSkillVersions);

    const items = skills.map((skill) => {
      const skillVersions = versions.filter((v) => v.skillId === skill.id);
      const active = skillVersions.find((v) => v.id === skill.activeVersionId) ?? null;
      return {
        ...skill,
        activeVersion: active ? { id: active.id, version: active.version, changeNote: active.changeNote } : null,
        versionCount: skillVersions.length,
      };
    });

    return ok({ items });
  });
}

/** Buat skill baru beserta versi awal. */
export async function POST(request: Request) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { key, name, description = "", modelTier = "main" } = (await request.json()) as {
      key?: string;
      name?: string;
      description?: string;
      modelTier?: "main" | "light";
    };
    if (!key || !name) return ok({ error: "key dan name wajib" }, { status: 400 });

    const [skill] = await db.insert(agentSkills).values({ key, name, description, modelTier, createdBy: user.id }).returning();
    const [version] = await db
      .insert(agentSkillVersions)
      .values({ skillId: skill.id, version: 1, instructionsMd: "", changeNote: "Versi awal", createdBy: user.id })
      .returning();
    await db.update(agentSkills).set({ activeVersionId: version.id }).where(eq(agentSkills.id, skill.id));

    return ok({ skill: { ...skill, activeVersionId: version.id } }, { status: 201 });
  });
}
