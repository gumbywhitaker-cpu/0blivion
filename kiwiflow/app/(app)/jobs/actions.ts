"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage, canManage } from "@/lib/auth/requireRole";
import { emitEvent } from "@/lib/conductor/emit";
import { notifyOrg } from "@/lib/notify";
import { recordAuditLog } from "@/lib/audit";
import { JOB_STATUS_TRANSITIONS, JOB_TYPES, JOB_PRIORITIES, type JobStatus } from "@/lib/types";
import type { SessionUser } from "@/lib/types";

export type FormState = { error?: string } | undefined;

const createJobSchema = z.object({
  orchardId: z.string().min(1, "Choose an orchard"),
  contractorOrgId: z.string().optional(),
  jobType: z.enum(JOB_TYPES),
  priority: z.enum(JOB_PRIORITIES),
  scheduledDate: z.string().min(1, "Choose a date"),
  startTime: z.string().optional(),
  estimatedDurationMins: z.string().optional(),
  instructions: z.string().trim().max(2000).optional(),
  rate: z.string().optional(),
  unit: z.string().trim().max(50).optional(),
  // Logistics Bridge (only meaningful for jobType=TRANSPORT — validated below,
  // not in the schema itself, since a HARVEST job legitimately omits both).
  destinationOrgId: z.string().optional(),
  loadDescription: z.string().trim().max(500).optional(),
});

export async function createJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "GROWER") {
    return { error: "Only grower organisations schedule jobs" };
  }
  assertCanManage(session.role);

  const parsed = createJobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const orchard = await prisma.orchard.findFirst({
    where: { id: data.orchardId, organizationId: session.organizationId },
  });
  if (!orchard) {
    return { error: "Orchard not found" };
  }

  if (data.contractorOrgId) {
    const link = await prisma.contractorLink.findFirst({
      where: {
        growerOrgId: session.organizationId,
        contractorOrgId: data.contractorOrgId,
        status: "ACTIVE",
      },
    });
    if (!link) {
      return { error: "That contractor isn't linked to your organisation" };
    }
  }

  let destinationOrgId: string | null = null;
  if (data.jobType === "TRANSPORT" && data.destinationOrgId) {
    const destination = await prisma.organization.findFirst({
      where: { id: data.destinationOrgId, type: "PACKHOUSE" },
    });
    if (!destination) return { error: "Destination pack house not found" };
    destinationOrgId = destination.id;
  }

  const status: JobStatus = data.contractorOrgId ? "SCHEDULED" : "NEW";
  const rate = data.rate ? Number.parseFloat(data.rate) : NaN;
  const durationMins = data.estimatedDurationMins ? Number.parseInt(data.estimatedDurationMins, 10) : NaN;

  const job = await prisma.job.create({
    data: {
      growerOrgId: session.organizationId,
      orchardId: orchard.id,
      contractorOrgId: data.contractorOrgId || null,
      jobType: data.jobType,
      priority: data.priority,
      status,
      scheduledDate: new Date(data.scheduledDate),
      startTime: data.startTime || null,
      estimatedDurationMins: Number.isFinite(durationMins) ? durationMins : null,
      instructions: data.instructions || null,
      rate: Number.isFinite(rate) ? rate : null,
      unit: data.unit || null,
      destinationOrgId,
      loadDescription: data.jobType === "TRANSPORT" ? data.loadDescription || null : null,
      createdById: session.userId,
      statusHistory: {
        create: [{ toStatus: status, changedById: session.userId }],
      },
    },
  });

  await emitEvent(session.organizationId, { type: "JOB_CREATED", payload: { jobId: job.id } });

  redirect(`/jobs/${job.id}`);
}

function canTransition(session: SessionUser, job: { growerOrgId: string; contractorOrgId: string | null }, toStatus: JobStatus): boolean {
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

const assignContractorSchema = z.object({
  jobId: z.string().min(1),
  contractorOrgId: z.string().min(1, "Choose a contractor"),
});

export async function assignContractorAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "GROWER") {
    return { error: "Only the grower can assign a contractor" };
  }
  assertCanManage(session.role);

  const parsed = assignContractorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { jobId, contractorOrgId } = parsed.data;

  const job = await prisma.job.findFirst({ where: { id: jobId, growerOrgId: session.organizationId } });
  if (!job) return { error: "Job not found" };
  if (job.status !== "NEW") return { error: "This job already has a contractor" };

  const link = await prisma.contractorLink.findFirst({
    where: { growerOrgId: session.organizationId, contractorOrgId, status: "ACTIVE" },
  });
  if (!link) return { error: "That contractor isn't linked to your organisation" };

  await prisma.$transaction(async (tx) => {
    await tx.job.update({ where: { id: job.id }, data: { contractorOrgId, status: "SCHEDULED" } });
    await tx.jobStatusHistory.create({
      data: { jobId: job.id, fromStatus: "NEW", toStatus: "SCHEDULED", changedById: session.userId },
    });
  });

  await emitEvent(session.organizationId, {
    type: "JOB_STATUS_CHANGED",
    payload: { jobId: job.id, fromStatus: "NEW", toStatus: "SCHEDULED" },
  });

  revalidatePath(`/jobs/${job.id}`);
}

const transitionSchema = z.object({
  jobId: z.string().min(1),
  toStatus: z.string().min(1),
  quantity: z.string().optional(),
  note: z.string().trim().max(1000).optional(),
});

export async function transitionJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = transitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { jobId, toStatus, quantity, note } = parsed.data;

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      OR: [{ growerOrgId: session.organizationId }, { contractorOrgId: session.organizationId }],
    },
  });
  if (!job) return { error: "Job not found" };

  const fromStatus = job.status as JobStatus;
  const target = toStatus as JobStatus;

  if (!JOB_STATUS_TRANSITIONS[fromStatus]?.includes(target)) {
    return { error: `Cannot move a job from ${fromStatus} to ${target}` };
  }
  if (!canTransition(session, job, target)) {
    return { error: "You don't have permission to make that change" };
  }

  let quantityValue: number | undefined;
  if (target === "COMPLETE") {
    quantityValue = quantity ? Number.parseFloat(quantity) : NaN;
    if (!Number.isFinite(quantityValue) || quantityValue! <= 0) {
      return { error: "Enter the completed quantity to mark this job done" };
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
        note: note || null,
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

  revalidatePath(`/jobs/${job.id}`);
}

const assignDriverSchema = z.object({
  jobId: z.string().min(1),
  driverId: z.string().min(1, "Choose a driver"),
});

/** The contractor/transport org handling a TRANSPORT job assigns one of its
 * own DRIVER-role users to it — separate from transitionJobAction because
 * this isn't a status change, and separate from job creation because the
 * grower who creates the job doesn't know the contractor's driver roster. */
export async function assignDriverToJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = assignDriverSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { jobId, driverId } = parsed.data;

  const job = await prisma.job.findFirst({
    where: { id: jobId, contractorOrgId: session.organizationId, jobType: "TRANSPORT" },
  });
  if (!job) return { error: "Job not found" };

  const driver = await prisma.user.findFirst({
    where: { id: driverId, organizationId: session.organizationId, role: "DRIVER" },
  });
  if (!driver) return { error: "That driver isn't part of your organisation" };

  await prisma.job.update({ where: { id: job.id }, data: { assignedDriverId: driver.id } });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "job.driver_assigned",
    entityType: "Job",
    entityId: job.id,
    detail: { driverId: driver.id },
  });

  revalidatePath(`/jobs/${job.id}`);
  revalidatePath("/driver");
}

const updateEtaSchema = z.object({
  jobId: z.string().min(1),
  etaAt: z.string().min(1, "Enter an ETA"),
});

/** The assigned driver updates a live ETA while en route — distinct from the
 * static scheduledDate/startTime set at booking time. Notifies the
 * destination pack house immediately, since that's the whole point of
 * "what's arriving and when" (docs/BLUEPRINT.md). */
export async function updateEtaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = updateEtaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { jobId, etaAt } = parsed.data;

  const job = await prisma.job.findFirst({ where: { id: jobId, assignedDriverId: session.userId } });
  if (!job) return { error: "Job not found" };

  const eta = new Date(etaAt);
  if (Number.isNaN(eta.getTime())) return { error: "Invalid ETA" };

  await prisma.job.update({ where: { id: job.id }, data: { etaAt: eta } });

  if (job.destinationOrgId) {
    await notifyOrg({
      organizationId: job.destinationOrgId,
      title: "Delivery ETA updated",
      body: `${job.loadDescription ?? "A load"} now expected ${eta.toISOString().slice(0, 16).replace("T", " ")}.`,
      urgency: "NORMAL",
      jobId: job.id,
    });
  }

  revalidatePath("/driver");
  revalidatePath("/packhouse");
}
