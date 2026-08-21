"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { emitEvent } from "@/lib/conductor/emit";
import {
  KIWIFRUIT_VARIETIES,
  MATURITY_REFERENCE_THRESHOLDS,
  COOLSTORE_REFERENCE_RANGE_C,
  BIOSECURITY_CATEGORIES,
  BIOSECURITY_RISK_LEVELS,
} from "@/lib/types";
import { notifyOrgOwners } from "@/lib/notify";

export type FormState = { error?: string } | undefined;

async function assertOnJob(jobId: string, organizationId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, OR: [{ growerOrgId: organizationId }, { contractorOrgId: organizationId }] },
  });
  if (!job) throw new Error("Job not found");
  return job;
}

const maturitySchema = z.object({
  jobId: z.string().min(1),
  orchardId: z.string().min(1),
  variety: z.enum(KIWIFRUIT_VARIETIES),
  testDate: z.string().min(1),
  dryMatterPercent: z.string().optional(),
  brix: z.string().min(1, "Brix reading is required"),
  sampleSize: z.string().optional(),
  labOrTester: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function recordMaturityTestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = maturitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    await assertOnJob(data.jobId, session.organizationId);
  } catch {
    return { error: "Job not found" };
  }

  const brix = Number.parseFloat(data.brix);
  const dryMatter = data.dryMatterPercent ? Number.parseFloat(data.dryMatterPercent) : NaN;
  const sampleSize = data.sampleSize ? Number.parseInt(data.sampleSize, 10) : NaN;

  const threshold = MATURITY_REFERENCE_THRESHOLDS[data.variety];
  const passed =
    brix >= threshold.minBrix && (!Number.isFinite(dryMatter) || dryMatter >= threshold.minDryMatterPercent);

  await prisma.harvestMaturityTest.create({
    data: {
      orchardId: data.orchardId,
      jobId: data.jobId,
      variety: data.variety,
      testDate: new Date(data.testDate),
      sampleSize: Number.isFinite(sampleSize) ? sampleSize : null,
      dryMatterPercent: Number.isFinite(dryMatter) ? dryMatter : null,
      brix,
      minDryMatterRequired: threshold.minDryMatterPercent,
      minBrixRequired: threshold.minBrix,
      passed,
      labOrTester: data.labOrTester || null,
      notes: data.notes || null,
      recordedById: session.userId,
    },
  });

  revalidatePath(`/jobs/${data.jobId}`);
}

const spraySchema = z.object({
  jobId: z.string().min(1),
  orchardId: z.string().min(1),
  productName: z.string().trim().min(1, "Product name is required"),
  activeIngredient: z.string().trim().max(200).optional(),
  hsrNumber: z.string().trim().max(50).optional(),
  rateApplied: z.string().min(1, "Rate is required"),
  rateUnit: z.string().trim().min(1, "Unit is required"),
  areaTreatedHa: z.string().optional(),
  targetPestOrDisease: z.string().trim().max(200).optional(),
  weatherConditions: z.string().trim().max(200).optional(),
  applicationDate: z.string().min(1),
  withholdingPeriodDays: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function recordSprayEntryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = spraySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    await assertOnJob(data.jobId, session.organizationId);
  } catch {
    return { error: "Job not found" };
  }

  const rateApplied = Number.parseFloat(data.rateApplied);
  const areaTreatedHa = data.areaTreatedHa ? Number.parseFloat(data.areaTreatedHa) : NaN;
  const withholdingDays = data.withholdingPeriodDays ? Number.parseInt(data.withholdingPeriodDays, 10) : NaN;
  const applicationDate = new Date(data.applicationDate);
  const harvestSafeDate = Number.isFinite(withholdingDays)
    ? new Date(applicationDate.getTime() + withholdingDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.sprayDiaryEntry.create({
    data: {
      orchardId: data.orchardId,
      jobId: data.jobId,
      productName: data.productName,
      activeIngredient: data.activeIngredient || null,
      hsrNumber: data.hsrNumber || null,
      rateApplied,
      rateUnit: data.rateUnit,
      areaTreatedHa: Number.isFinite(areaTreatedHa) ? areaTreatedHa : null,
      targetPestOrDisease: data.targetPestOrDisease || null,
      weatherConditions: data.weatherConditions || null,
      applicationDate,
      withholdingPeriodDays: Number.isFinite(withholdingDays) ? withholdingDays : null,
      harvestSafeDate,
      applicatorId: session.userId,
      notes: data.notes || null,
    },
  });

  revalidatePath(`/jobs/${data.jobId}`);
}

const coolstoreSchema = z.object({
  facilityName: z.string().trim().min(1, "Facility/room name is required"),
  temperatureC: z.string().min(1, "Temperature is required"),
  humidityPercent: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function recordCoolstoreLogAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = coolstoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const temperatureC = Number.parseFloat(data.temperatureC);
  const humidityPercent = data.humidityPercent ? Number.parseFloat(data.humidityPercent) : NaN;
  const { min, max } = COOLSTORE_REFERENCE_RANGE_C;
  const withinRange = temperatureC >= min && temperatureC <= max;

  const log = await prisma.coolstoreTemperatureLog.create({
    data: {
      organizationId: session.organizationId,
      facilityName: data.facilityName,
      temperatureC,
      humidityPercent: Number.isFinite(humidityPercent) ? humidityPercent : null,
      minRangeC: min,
      maxRangeC: max,
      withinRange,
      recordedById: session.userId,
      notes: data.notes || null,
    },
  });

  if (!withinRange) {
    await emitEvent(session.organizationId, {
      type: "COOLSTORE_TEMP_ALERT",
      payload: {
        logId: log.id,
        organizationId: session.organizationId,
        facilityName: log.facilityName,
        temperatureC: log.temperatureC,
      },
    });
  }

  revalidatePath("/coolstore");
}

const biosecuritySchema = z.object({
  jobId: z.string().min(1),
  orchardId: z.string().min(1),
  inspectionDate: z.string().min(1),
  category: z.enum(BIOSECURITY_CATEGORIES),
  riskLevel: z.enum(BIOSECURITY_RISK_LEVELS),
  findings: z.string().trim().min(1, "Describe what was found"),
  actionTaken: z.string().trim().max(1000).optional(),
  followUpRequired: z.string().optional(),
  followUpDate: z.string().optional(),
});

/** Recorded from the job that put someone on the orchard — same access
 * pattern as spray diary/maturity entries: whichever org (grower or the
 * contractor doing the work) is party to the job can log a finding. This is
 * KiwiFlow's own record, not a submission to KVH or any biosecurity
 * authority. */
export async function recordBiosecurityInspectionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = biosecuritySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const job = await assertOnJob(data.jobId, session.organizationId).catch(() => null);
  if (!job) return { error: "Job not found" };

  const followUpRequired = data.followUpRequired === "on";
  const followUpDate = followUpRequired && data.followUpDate ? new Date(data.followUpDate) : null;

  await prisma.biosecurityInspection.create({
    data: {
      orchardId: data.orchardId,
      inspectionDate: new Date(data.inspectionDate),
      category: data.category,
      riskLevel: data.riskLevel,
      findings: data.findings,
      actionTaken: data.actionTaken || null,
      followUpRequired,
      followUpDate,
      inspectedById: session.userId,
    },
  });

  if (data.riskLevel === "HIGH") {
    await notifyOrgOwners({
      organizationId: job.growerOrgId,
      title: `High-risk biosecurity finding: ${data.category}`,
      body: data.findings,
      urgency: "URGENT",
    });
  }

  revalidatePath(`/jobs/${data.jobId}`);
  revalidatePath("/biosecurity");
}
