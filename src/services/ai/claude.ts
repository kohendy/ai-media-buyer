import type { z } from "zod";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { getEnv, isAiConfigured } from "@/lib/env";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI_BASE_URL dan AI_API_KEY belum diisi.");
    this.name = "AiNotConfiguredError";
  }
}

export class AiOutputInvalidError extends Error {
  constructor(detail: string) {
    super(`Keluaran AI tidak valid: ${detail}`);
    this.name = "AiOutputInvalidError";
  }
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export type CompleteInput = {
  purpose: string;
  prompt: string;
  system?: string;
  tier?: "main" | "light";
  schema?: z.ZodType<unknown>;
  userId?: string | null;
  temperature?: number;
};

/**
 * Panggil Claude lewat base URL berbentuk OpenAI-compatible (`/chat/completions`).
 * Penyedia dan model dapat diganti lewat env tanpa mengubah kode.
 */
export async function complete(input: CompleteInput): Promise<{ text: string; data?: unknown; model: string }> {
  const env = getEnv();
  if (!isAiConfigured()) throw new AiNotConfiguredError();

  const model = input.tier === "light" ? env.AI_MODEL_LIGHT : env.AI_MODEL_MAIN;
  const response = await fetch(`${env.AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.4,
      messages: [
        ...(input.system ? [{ role: "system", content: input.system }] : []),
        { role: "user", content: input.prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Permintaan AI gagal (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = payload.choices?.[0]?.message?.content ?? "";

  await db.insert(aiUsage).values({
    userId: input.userId ?? null,
    provider: "claude",
    purpose: input.purpose,
    model,
    inputTokens: payload.usage?.prompt_tokens ?? 0,
    outputTokens: payload.usage?.completion_tokens ?? 0,
    costIdr: 0,
  });

  if (!input.schema) return { text, model };

  const data = extractJson(text);
  const parsed = input.schema.safeParse(data);
  if (!parsed.success) throw new AiOutputInvalidError(parsed.error.issues[0]?.message ?? "skema tidak cocok");
  return { text, data: parsed.data, model };
}
