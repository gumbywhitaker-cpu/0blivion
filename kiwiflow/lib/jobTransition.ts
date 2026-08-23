import "server-only";
import { prisma } from "@/lib/db";
import { canManage } from "@/lib/auth/requireRole";
import { emitEvent } from "@/lib/conductor/emit";
import { notifyOrg } from "@/lib/notify";
import { JOB_STATUS_TRANSITIONS, type JobStatus, type SessionUser } from "@/lib/types";

/**
 * The one place job status transitions actually happen — shared between the
 * Server Action (app/(app)/jobs/actions.ts, used by the grower side and by
 * contractor users with a live connection) and the offline-capable API route
 * (app/api/v1/jobs/transition/route.ts, used by the Contractor Hub's queued
 * sync). Keeping this in one function means the offline path can't drift
 * from — or bypass — the same permission and status-machine rules.
 */

export type TransitionOutcome =
  | { ok: true; job: { id: string; status: string } }
  | { ok: false; code: "not_found" | "invalid_transition" | "forbidden" | "validation"; error: string };

export function canTransitionJob(
  session: SessionUser,
  job: { growerOrgId: string; contractorOrgId: string | null },
  toStatus: JobStatus,
): boolean {
  if (toStatus === "SCHEDULED") {
    return session.organizationId === job.growerOrgId && canManage(session.role) && !!job.contractorOrgId;
  }
  if (toStatus === "CONFIRMED") {
    return session.organizationId === job.contractorOrgId && canManage(session.role);
  }
  if (toStatus === "IN_PROGRESS" || toStatus === "COMPLETE") {
    return session.organizationId === job.contractorOrgId;
  }
  if (toStatus === "CANCELLED") {
    return (
      (session.organizationId === job.growerOrgId || session.organizationId === job.contractorOrgId) &&
      canManage(session.role)
    );
  }
  return false; // INVOICED is system-only, driven by the Conductor
}

export async function applyJobTransition(
  session: SessionUser,
  params: { jobId: string; toStatus: string; quantity?: number; note?: string },
): Promise<TransitionOutcome> {
  const job = await prisma.job.findFirst({
    where: {
      id: params.jobId,
      OR: [{ growerOrgId: session.organizationId }, { contractorOrgId: session.organizationId }],
    },
  });
  if (!job) return { ok: false, code: "not_found", error: "Job not found" };

  const fromStatus = job.status as JobStatus;
  const target = params.toStatus as JobStatus;

  if (!JOB_STATUS_TRANSITIONS[fromStatus]?.includes(target)) {
    // This is the conflict case an offline queue actually has to handle: the
    // job moved on (someone else completed it from another device) while
    // this device was offline. Surfaced as a distinct code so the client can
    // tell "your queued change no longer applies" apart from "you're not
    // allowed to do that" or "you typed something invalid" — silently
    // dropping or force-applying either would corrupt the record.
    return { ok: false, code: "invalid_transition", error: `Cannot move a job from ${fromStatus} to ${target}` };
  }
  if (!canTransitionJob(session, job, target)) {
    return { ok: false, code: "forbidden", error: "You don't have permission to make that change" };
  }

  let quantityValue: number | undefined;
  if (target === "COMPLETE") {
    quantityValue = params.quantity;
    if (!Number.isFinite(quantityValue) || quantityValue === undefined || quantityValue <= 0) {
      return { ok: false, code: "validation", error: "Enter the completed quantity to mark this job done" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id: job.id },
      data: {
        status: target,
        ...(quantityValue !== undefined ? { quantity: quantityValue } : {}),
      },
    });
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        fromStatus,
        toStatus: target,
        changedById: session.userId,
        note: params.note || null,
      },
    });
  });

  await emitEvent(job.growerOrgId, {
    type: "JOB_STATUS_CHANGED",
    payload: { jobId: job.id, fromStatus, toStatus: target },
  });
  if (target === "COMPLETE") {
    await emitEvent(job.growerOrgId, { type: "JOB_COMPLETED", payload: { jobId: job.id } });
  }

  // Logistics Bridge: the destination pack house has no other way to learn a
  // delivery is now on the road or has arrived — it isn't the grower or the
  // contractor org on this job, so the Conductor's own-org rule engine can't
  // reach it. A direct notify here, not a WorkflowRule, matches how
  // notifyMaterialOrderUpdate handles the same kind of narrow cross-org case.
  if (job.jobType === "TRANSPORT" && job.destinationOrgId && (target === "IN_PROGRESS" || target === "COMPLETE")) {
    await notifyOrg({
      organizationId: job.destinationOrgId,
      title: target === "IN_PROGRESS" ? "Delivery on its way" : "Delivery arrived",
      body:
        target === "IN_PROGRESS"
          ? `${job.loadDescription ?? "A load"} is now in transit${job.etaAt ? `, ETA ${job.etaAt.toISOString().slice(0, 16).replace("T", " ")}` : ""}.`
          : `${job.loadDescription ?? "A load"} has arrived.`,
      urgency: "NORMAL",
      jobId: job.id,
    });
  }

  return { ok: true, job: { id: job.id, status: target } };
}
