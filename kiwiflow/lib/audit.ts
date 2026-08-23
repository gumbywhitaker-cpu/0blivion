import "server-only";
import { prisma } from "@/lib/db";

/**
 * Security-relevant audit trail — auth events (signup/login/MFA), privileged
 * (ADMIN) access, and non-domain-specific state changes. Distinct from
 * JobStatusHistory, which already covers job lifecycle transitions in more
 * domain-specific detail than this generic log needs to duplicate.
 *
 * Never throws: a broken audit write must not take down the primary action
 * (a signup or login) it's recording. Failures are logged to stderr, which
 * a real deployment should route to a monitored sink rather than let vanish
 * into request logs.
 */
export async function recordAuditLog(entry: {
  organizationId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorId: entry.actorId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        detail: entry.detail ? JSON.stringify(entry.detail) : null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record audit log entry", entry.action, err);
  }
}
