import { z } from "zod";

/* ---------- Owner context (konteks pemilik) ---------- */
export const ownerContextSchema = z.object({
  productType: z.enum(["online_physical", "digital", "offline_service", "other"]).describe("Jenis produk tidak valid"),
  location: z.string().min(2, "Lokasi/radius wajib diisi"),
  capitalIdr: z.number().int().positive("Modal harus angka positif"),
  minMarginPct: z.number().int().min(1).max(100, "Margin minimum 1-100%"),
  productionCapability: z.string().min(10, "Kemampuan produksi/pengadaan minimal 10 karakter"),
});

/* ---------- Satu kandidat produk ---------- */
export const candidateSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  category: z.string().optional(),
  note: z.string().optional(),
});

/* ---------- Form riset lengkap ---------- */
export const researchFormSchema = z.object({
  ownerContext: ownerContextSchema,
  candidates: z
    .array(candidateSchema)
    .min(1, "Minimal 1 kandidat produk")
    .max(10, "Maksimal 10 kandidat produk"),
  suggestFromCategory: z.string().optional(),
});

/* ---------- Tipe TypeScript ---------- */
export type OwnerContext = z.infer<typeof ownerContextSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type ResearchForm = z.infer<typeof researchFormSchema>;