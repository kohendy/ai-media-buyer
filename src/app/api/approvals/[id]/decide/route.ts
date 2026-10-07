import { apiHandler, fail, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { decideApproval, type Decision } from "@/domain/approvals";

const DECISIONS: Decision[] = ["approve", "reject", "revision"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await readJson<{ decision?: string; note?: string }>(request);
    const decision = body.decision as Decision | undefined;

    if (!decision || !DECISIONS.includes(decision)) {
      return fail(400, "INVALID_DECISION", "Keputusan harus approve, reject, atau revision.");
    }

    const result = await decideApproval({ approvalId: id, decision, userId: user.id, note: body.note });
    if (!result.ok) {
      if (result.code === "KILL_SWITCH_ACTIVE") {
        return fail(409, "KILL_SWITCH_ACTIVE", "Kill switch aktif: persetujuan terkunci.");
      }
      return fail(400, result.code, "Item tidak dapat diputuskan.");
    }

    return ok({ item: result.row });
  });
}
