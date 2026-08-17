import "server-only";
import { prisma } from "@/lib/db";

export async function writeAuditLog(params: {
  businessId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        businessId: params.businessId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
  } catch (err) {
    // Audit logging must never break the primary request.
    console.error("Failed to write audit log:", err);
  }
}
