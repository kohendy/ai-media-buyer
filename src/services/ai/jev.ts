import { db } from "@/db";
import { aiUsage, judgmentQuestions, judgments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getEnv, isAiConfigured, isJevConfigured } from "@/lib/env";
import { complete } from "./claude";

export type JudgeInput = {
  questionKey: string;
  subjectType: string;
  subjectId: string;
  options: string[];
  context?: string;
  threshold?: number;
  userId?: string | null;
  /** Jawaban yang dipilih manusia, untuk evaluasi akurasi. */
  humanAnswer?: string;
};

export type JudgeResult = {
  answer: string;
  probabilities: Record<string, number>;
  confidence: number;
  threshold: number;
  forwarded: boolean;
  model: string;
};

/**
 * Pembungkus tunggal untuk Jev. Ambang keyakinan ditetapkan pemilik;
 * penilaian di bawah ambang ditandai `forwarded` dan tidak dipakai langsung.
 * Bila Jev tidak tersedia, penilaian dialihkan ke model umum atau simulasi.
 */
export async function judge(input: JudgeInput): Promise<JudgeResult> {
  const env = getEnv();
  const threshold = input.threshold ?? env.JEV_CONFIDENCE_THRESHOLD;

  const result = await runJudge(input, threshold);

  await db.insert(judgments).values({
    questionId: await resolveQuestionId(input),
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    answer: result.answer,
    probabilities: result.probabilities,
    confidence: result.confidence.toFixed(3),
    forwarded: result.forwarded,
    humanAnswer: input.humanAnswer ?? null,
    model: result.model,
  });

  return result;
}

async function resolveQuestionId(input: JudgeInput): Promise<string> {
  const [existing] = await db
    .select()
    .from(judgmentQuestions)
    .where(and(eq(judgmentQuestions.key, input.questionKey), eq(judgmentQuestions.isActive, true)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(judgmentQuestions)
    .values({
      key: input.questionKey,
      appliesTo: "product_insight",
      prompt: input.context ?? input.questionKey,
      answerType: "choice",
      options: input.options,
      threshold: getEnv().JEV_CONFIDENCE_THRESHOLD.toFixed(3),
    })
    .returning();
  return created.id;
}

async function runJudge(input: JudgeInput, threshold: number): Promise<JudgeResult> {
  const env = getEnv();

  if (isJevConfigured()) {
    const response = await fetch(`${env.JEV_BASE_URL.replace(/\/$/, "")}/judge`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.JEV_API_KEY}` },
      body: JSON.stringify({ question: input.questionKey, options: input.options, context: input.context ?? "" }),
    });
    if (response.ok) {
      const payload = (await response.json()) as Partial<JudgeResult>;
      return finalize(payload, input, threshold, env.JEV_MODEL);
    }
  }

  if (isAiConfigured()) {
    const { text } = await complete({
      purpose: "judge",
      tier: "light",
      prompt: `Nilai objek berikut.\nPertanyaan: ${input.questionKey}\nPilihan: ${input.options.join(", ")}\nKonteks: ${input.context ?? "-"}\nBalas JSON: {"answer":"<pilihan>","probabilities":{"<pilihan>":0.0}}`,
      userId: input.userId,
    });
    const parsed = safeParse(text);
    if (parsed) return finalize(parsed, input, threshold, `${env.AI_MODEL_LIGHT} (fallback)`);
  }

  return finalizeSimulated(input, threshold);
}

function finalize(
  payload: Partial<JudgeResult>,
  input: JudgeInput,
  threshold: number,
  model: string,
): JudgeResult {
  const answer = input.options.includes(String(payload.answer)) ? String(payload.answer) : input.options[0];
  const probabilities = payload.probabilities ?? { [answer]: payload.confidence ?? 0.8 };
  const confidence = typeof payload.confidence === "number" ? payload.confidence : Number(probabilities[answer] ?? 0.8);
  return { answer, probabilities, confidence, threshold, forwarded: confidence < threshold, model };
}

function finalizeSimulated(input: JudgeInput, threshold: number): JudgeResult {
  const answer = input.options[0];
  const confidence = 0.62;
  return {
    answer,
    probabilities: { [answer]: confidence },
    confidence,
    threshold,
    forwarded: confidence < threshold,
    model: "simulated",
  };
}

function safeParse(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Partial<JudgeResult>;
  } catch {
    return null;
  }
}

export async function recordAiUsage(provider: "jev" | "image" | "video", purpose: string, model: string, costIdr = 0) {
  await db.insert(aiUsage).values({ provider, purpose, model, costIdr });
}
