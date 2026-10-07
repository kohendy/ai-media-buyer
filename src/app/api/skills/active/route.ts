import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentSkillVersions, agentSkills } from "@/db/schema";
import { apiHandler, fail, header, ok } from "@/lib/api";
import { checkSharedSecret, requireUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";

/**
 * n8n mengambil skill aktif lewat endpoint ini (dengan secret),
 * lalu memakainya sebagai instruksi sistem pada pemanggilan Claude.
 */
export async function GET(request: Request) {
  return apiHandler(async () => {
    const env = getEnv();
    const secret = header(request, "x-n8n-secret");
    const authorized = checkSharedSecret(secret, env.N8N_TRIGGER_SECRET);
    if (!authorized) await requireUser();

    const key = new URL(request.url).searchParams.get("key");
    if (!key) return fail(400, "KEY_REQUIRED", "Parameter key wajib diisi.");

    const [skill] = await db.select().from(agentSkills).where(eq(agentSkills.key, key)).limit(1);
    if (!skill) return fail(404, "SKILL_NOT_FOUND", "Skill tidak ditemukan.");

    const [version] = skill.activeVersionId
      ? await db.select().from(agentSkillVersions).where(eq(agentSkillVersions.id, skill.activeVersionId)).limit(1)
      : await db
          .select()
          .from(agentSkillVersions)
          .where(eq(agentSkillVersions.skillId, skill.id))
          .orderBy(desc(agentSkillVersions.version))
          .limit(1);

    if (!version) return fail(404, "VERSION_NOT_FOUND", "Skill belum punya versi.");

    return ok({
      key: skill.key,
      name: skill.name,
      modelTier: skill.modelTier,
      outputSchema: skill.outputSchema,
      version: version.version,
      versionId: version.id,
      instructions: version.instructionsMd,
      examples: version.examples,
    });
  });
}
