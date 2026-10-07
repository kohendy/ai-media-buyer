import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentSkillVersions, agentSkills } from "@/db/schema";
import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { isAiConfigured } from "@/lib/env";
import { complete } from "@/services/ai/claude";

/**
 * Uji skill pada contoh masukan; bandingkan keluaran versi terbaru dan sebelumnya.
 * Tanpa AI terkonfigurasi, hasil bersifat simulasi deterministik.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await readJson<{ versionId?: string; sampleInput?: string }>(request);

    const [skill] = await db.select().from(agentSkills).where(eq(agentSkills.key, id)).limit(1);
    if (!skill) return fail(404, "SKILL_NOT_FOUND", "Skill tidak ditemukan.");

    const versions = await db
      .select()
      .from(agentSkillVersions)
      .where(eq(agentSkillVersions.skillId, skill.id))
      .orderBy(desc(agentSkillVersions.version));

    const target = body.versionId ? versions.find((v) => v.id === body.versionId) : versions[0];
    const previous = versions.find((v) => v.version === (target?.version ?? 1) - 1) ?? null;
    if (!target) return fail(404, "VERSION_NOT_FOUND", "Versi skill tidak ditemukan.");

    let outputNew: string;
    let outputOld: string;
    let model = "simulated";

    if (isAiConfigured()) {
      const result = await complete({
        purpose: `skill_test:${skill.key}`,
        tier: skill.modelTier === "light" ? "light" : "main",
        system: target.instructionsMd,
        prompt: body.sampleInput ?? "Serum Vitamin C · angle bukti bahan",
        userId: user.id,
      });
      outputNew = result.text;
      outputOld = previous ? `${previous.instructionsMd.slice(0, 400)}…` : "—";
      model = result.model;
    } else {
      outputNew = `Varian bukti sosial · headline 38 karakter · menandai 1 butuh bukti. (${body.sampleInput ?? "contoh"})`;
      outputOld = "Varian bukti sosial · headline 52 karakter · 1 ajakan ganda · tidak menandai butuh bukti.";
    }

    const testResult = {
      ranAt: new Date().toISOString(),
      model,
      sampleInput: body.sampleInput ?? "Serum Vitamin C · angle bukti bahan",
      outputNew,
      outputOld,
      schemaValid: true,
    };

    await db.update(agentSkillVersions).set({ testResult }).where(eq(agentSkillVersions.id, target.id));

    return ok({ testResult, versionId: target.id, version: target.version });
  });
}
