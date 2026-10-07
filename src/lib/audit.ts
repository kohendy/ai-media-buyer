import { db } from "@/db";
import { actionLog, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AuditAction = "create" | "update" | "delete" | "approve" | "reject" | "kill" | "resume";

export async function recordAudit(input: {
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  await db.insert(auditLog).values({
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
  });
}

export type RecordActionInput = {
  approvalId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metaObjectId?: string | null;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  idempotencyKey: string;
  mode?: "manual_approved" | "auto";
  status?: "sent" | "confirmed" | "failed";
};

/**
 * Catat aksi ke Meta dengan kunci idempotensi.
 * Bila kunci sudah ada, aksi tidak diulang dan baris lama dikembalikan.
 */
export async function recordAction(input: RecordActionInput) {
  const [existing] = await db
    .select()
    .from(actionLog)
    .where(eq(actionLog.idempotencyKey, input.idempotencyKey))
    .limit(1);

  if (existing) return { inserted: false as const, row: existing };

  const [row] = await db
    .insert(actionLog)
    .values({
      approvalId: input.approvalId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metaObjectId: input.metaObjectId ?? null,
      request: input.request ?? {},
      response: input.response ?? {},
      idempotencyKey: input.idempotencyKey,
      mode: input.mode ?? "manual_approved",
      status: input.status ?? "sent",
    })
    .returning();

  return { inserted: true as const, row };
}
