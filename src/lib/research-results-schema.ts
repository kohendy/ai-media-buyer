import { z } from "zod";

/* ---------- Source (sumber data) ---------- */
export const sourceSchema = z.object({
  label: z.string().min(1, "Label sumber wajib diisi"),
  url: z.string().url("URL harus valid").optional().or(z.literal("")),
  retrievedAt: z.string().datetime({ offset: true }),
  kind: z.enum(["fact", "estimate", "assumption"]),
});

/* ---------- Score (skor Jev per pertanyaan) ---------- */
export const scoreSchema = z.object({
  questionKey: z.enum(["demand", "competition", "margin", "ad_ease", "owner_fit"]),
  answer: z.string().min(1, "Jawaban wajib diisi"),
  confidence: z.number().min(0).max(1, "Confidence 0-1"),
});

/* ---------- Market Brief ---------- */
export const marketBriefSchema = z.object({
  summary: z.string().min(10, "Ringkasan minimal 10 karakter"),
  demand: z.string().min(1, "Permintaan wajib diisi"),
  marketPrice: z.string().min(1, "Harga pasar wajib diisi"),
  competitors: z.string().min(1, "Kompetitor wajib diisi"),
  gaps: z.string().min(1, "Celah pasar wajib diisi"),
  risks: z.string().min(1, "Risiko wajib diisi"),
  recommendation: z.string().min(1, "Rekomendasi wajib diisi"),
  validationPlan: z.string().min(1, "Rencana validasi wajib diisi"),
});

/* ---------- Payload utama ---------- */
export const researchResultsSchema = z.object({
  jobId: z.string().uuid("jobId harus UUID valid"),
  productId: z.string().uuid("productId harus UUID valid"),
  scores: z.array(scoreSchema).length(5, "Harus ada 5 skor (demand, competition, margin, ad_ease, owner_fit)"),
  marketBrief: marketBriefSchema,
  sources: z.array(sourceSchema).min(1, "Minimal 1 sumber data wajib"),
});

/* ---------- Tipe TypeScript ---------- */
export type Source = z.infer<typeof sourceSchema>;
export type Score = z.infer<typeof scoreSchema>;
export type MarketBrief = z.infer<typeof marketBriefSchema>;
export type ResearchResults = z.infer<typeof researchResultsSchema>;