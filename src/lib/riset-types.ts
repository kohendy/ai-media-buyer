/* ---------- Shared types untuk halaman riset ---------- */

export type Source = {
  label: string;
  url?: string;
  retrievedAt: string;
  kind: "fact" | "estimate" | "assumption";
};

export type MarketBrief = {
  id: string;
  productId: string;
  version: number;
  demandSummary: string;
  priceMin: number | null;
  priceMax: number | null;
  competitors: unknown[];
  gaps: string | null;
  risks: string | null;
  validationPlan: string | null;
  sources: Source[];
  contentMd: string | null;
  createdAt: string;
  recommendation?: string | null;
} | null;

export type Product = {
  id: string;
  name: string;
  score: string | null;
  confidence: string | null;
  status: string;
};

export type Score = {
  questionKey: string;
  answer: string;
  confidence: number;
  forwarded: boolean;
};

export type Data = {
  product: Product;
  brief: MarketBrief;
  scores: Score[];
} | null;