import { apiHandler, ok } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { isKillSwitchActive, setKillSwitch } from "@/lib/settings";

export async function GET() {
  return apiHandler(async () => ok({ active: await isKillSwitchActive() }));
}

/** Aktifkan kill switch: hentikan semua aksi tulis otomatis. */
export async function POST() {
  return apiHandler(async () => {
    const user = await requireOwner();
    await setKillSwitch(true, user.id);
    return ok({ active: true });
  });
}
