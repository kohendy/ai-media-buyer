import { apiHandler, ok } from "@/lib/api";
import { createLoginLink, requireUser } from "@/lib/auth";

/** Buat tautan masuk sekali pakai (dipakai dashboard atau bot). */
export async function POST() {
  return apiHandler(async () => {
    const user = await requireUser();
    const link = await createLoginLink(user.id, 5);
    return ok({ url: link.url, expiresAt: link.expiresAt });
  });
}
