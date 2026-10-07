import { db } from "@/db";
import { approvals } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { isKillSwitchActive } from "@/lib/settings";

export type CreateApprovalInput = {
  kind: (typeof approvals.$inferInsert)["kind"];
  subjectType: string;
  subjectId: string;
  title: string;
  summary?: string;
  reasons?: string[];
  payload?: Record<string, unknown>;
  expiresInHours?: number;
};

export async function createApproval(input: CreateApprovalInput) {
  const expiresAt = input.expiresInHours
    ? new Date(Date.now() + input.expiresInHours * 3_600_000)
    : new Date(Date.now() + 48 * 3_600_000);

  const [row] = await db
    .insert(approvals)
    .values({
      kind: input.kind,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      title: input.title,
      summary: input.summary ?? "",
      reasons: input.reasons ?? [],
      payload: input.payload ?? {},
      expiresAt,
    })
    .returning();

  await recordAudit({
    userId: null,
    action: "create",
    entityType: "approvals",
    entityId: row.id,
    after: { kind: row.kind, title: row.title, status: row.status },
  });

  return row;
}

export async function listPendingApprovals(limit = 50) {
  return db
    .select()
    .from(approvals)
    .where(eq(approvals.status, "pending"))
    .orderBy(desc(approvals.requestedAt))
    .limit(limit);
}

export type Decision = "approve" | "reject" | "revision";

export async function decideApproval(input: {
  approvalId: string;
  decision: Decision;
  userId: string;
  note?: string;
}) {
  const [row] = await db.select().from(approvals).where(eq(approvals.id, input.approvalId)).limit(1);
  if (!row) return { ok: false as const, code: "NOT_FOUND" as const };
  if (row.status !== "pending") return { ok: false as const, code: "NOT_PENDING" as const };

  if (input.decision === "approve" && (await isKillSwitchActive())) {
    return { ok: false as const, code: "KILL_SWITCH_ACTIVE" as const };
  }

  const status = input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "revision";

  const [updated] = await db
    .update(approvals)
    .set({
      status,
      decidedBy: input.userId,
      decidedAt: new Date(),
      decisionNote: input.note ?? null,
    })
    .where(and(eq(approvals.id, input.approvalId), eq(approvals.status, "pending")))
    .returning();

  await recordAudit({
    userId: input.userId,
    action: input.decision === "approve" ? "approve" : "reject",
    entityType: "approvals",
    entityId: row.id,
    before: { status: row.status },
    after: { status: updated.status, note: input.note ?? null },
  });

  return { ok: true as const, row: updated };
}

/** Tandai item kedaluwarsa yang belum ditanggapi. */
export async function expireStaleApprovals() {
  const pending = await db.select().from(approvals).where(eq(approvals.status, "pending"));
  const now = Date.now();
  const stale = pending.filter((row) => row.expiresAt && row.expiresAt.getTime() < now);
  for (const row of stale) {
    await db.update(approvals).set({ status: "expired" }).where(eq(approvals.id, row.id));
  }
  return stale.length;
}
