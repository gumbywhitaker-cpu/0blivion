"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export type FormState = { error?: string } | undefined;

const gradingSchema = z.object({
  jobId: z.string().min(1),
  gradingDate: z.string().min(1),
  totalTrayEquivalents: z.string().min(1, "Enter total tray equivalents"),
  class1Percent: z.string().optional(),
  class2Percent: z.string().optional(),
  rejectPercent: z.string().optional(),
  averageBrix: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

/** Manual entry only — no TOMRA/sorter API integration exists. A packhouse
 * can record one grading result per delivered load; re-submitting on the
 * same job updates rather than duplicates, since the real-world correction
 * case ("we mis-typed the reject %") is more common than a second load
 * against the same job. */
export async function recordGradingResultAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return { error: "Only pack house organisations record grading results" };
  }

  const parsed = gradingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const job = await prisma.job.findFirst({
    where: { id: data.jobId, destinationOrgId: session.organizationId, jobType: "TRANSPORT" },
  });
  if (!job) return { error: "Delivery not found" };

  const totalTrayEquivalents = Number.parseFloat(data.totalTrayEquivalents);
  if (!Number.isFinite(totalTrayEquivalents)) return { error: "Invalid tray equivalent total" };

  const class1Percent = data.class1Percent ? Number.parseFloat(data.class1Percent) : NaN;
  const class2Percent = data.class2Percent ? Number.parseFloat(data.class2Percent) : NaN;
  const rejectPercent = data.rejectPercent ? Number.parseFloat(data.rejectPercent) : NaN;
  const averageBrix = data.averageBrix ? Number.parseFloat(data.averageBrix) : NaN;

  const existing = await prisma.gradingResult.findFirst({ where: { jobId: job.id } });

  const values = {
    gradingDate: new Date(data.gradingDate),
    totalTrayEquivalents,
    class1Percent: Number.isFinite(class1Percent) ? class1Percent : null,
    class2Percent: Number.isFinite(class2Percent) ? class2Percent : null,
    rejectPercent: Number.isFinite(rejectPercent) ? rejectPercent : null,
    averageBrix: Number.isFinite(averageBrix) ? averageBrix : null,
    notes: data.notes || null,
    recordedById: session.userId,
  };

  let result;
  if (existing) {
    result = await prisma.gradingResult.update({ where: { id: existing.id }, data: values });
  } else {
    result = await prisma.gradingResult.create({
      data: { jobId: job.id, organizationId: session.organizationId, ...values },
    });
  }

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: existing ? "grading_result.updated" : "grading_result.recorded",
    entityType: "GradingResult",
    entityId: result.id,
    detail: { jobId: job.id, totalTrayEquivalents },
  });

  revalidatePath("/packhouse");
  revalidatePath(`/jobs/${job.id}`);
}
