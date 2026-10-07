import { apiHandler, ok } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { setKillSwitch } from "@/lib/settings";

/** Nonaktifkan kill switch (hanya pemilik). */
export async function POST() {
  return apiHandler(async () => {
    const user = await requireOwner();
    await setKillSwitch(false, user.id);
    return ok({ active: false });
  });
}
