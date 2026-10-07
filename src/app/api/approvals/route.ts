import { apiHandler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listPendingApprovals } from "@/domain/approvals";
import { isKillSwitchActive } from "@/lib/settings";

export async function GET(request: Request) {
  return apiHandler(async () => {
    await requireUser();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const [items, killSwitchActive] = await Promise.all([
      listPendingApprovals(Number.isFinite(limit) ? limit : 50),
      isKillSwitchActive(),
    ]);
    return ok({ items, killSwitchActive });
  });
}
