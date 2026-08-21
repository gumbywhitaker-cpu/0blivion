"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage, canManage } from "@/lib/auth/requireRole";
import { emitEvent } from "@/lib/conductor/emit";
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

  revalidatePath(`/jobs/${job.id}`);
}
