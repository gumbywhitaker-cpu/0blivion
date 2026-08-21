"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { EMPLOYMENT_TYPES } from "@/lib/types";

export type FormState = { error?: string } | undefined;

const crewSchema = z.object({ name: z.string().trim().min(2).max(200) });

export async function createCrewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "CONTRACTOR") {
    return { error: "Only contractor organisations manage crews" };
  }
  assertCanManage(session.role);

  const parsed = crewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const crew = await prisma.crew.create({
    data: { organizationId: session.organizationId, name: parsed.data.name },
  });

  redirect(`/crews/${crew.id}`);
}

const memberSchema = z.object({
  crewId: z.string().min(1),
  name: z.string().trim().min(2).max(200),
  phone: z.string().trim().max(30).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).default("HOURLY"),
  isRse: z.string().optional(),
  hourlyRate: z.string().optional(),
  minGuaranteedHoursPerWeek: z.string().optional(),
});

export async function addCrewMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { crewId, name, phone, employmentType, isRse, hourlyRate, minGuaranteedHoursPerWeek } = parsed.data;

  const crew = await prisma.crew.findFirst({
    where: { id: crewId, organizationId: session.organizationId },
  });
  if (!crew) {
    return { error: "Crew not found" };
  }

  const rate = hourlyRate ? Number.parseFloat(hourlyRate) : NaN;
  const minHours = minGuaranteedHoursPerWeek ? Number.parseFloat(minGuaranteedHoursPerWeek) : NaN;

  await prisma.crewMember.create({
    data: {
      crewId,
      name,
      phone: phone || null,
      employmentType,
      isRse: isRse === "on",
      hourlyRate: Number.isFinite(rate) ? rate : null,
      minGuaranteedHoursPerWeek: Number.isFinite(minHours) ? minHours : null,
    },
  });
  revalidatePath(`/crews/${crewId}`);
}

const timeEntrySchema = z.object({
  crewMemberId: z.string().min(1),
  jobId: z.string().optional(),
  clockIn: z.string().min(1, "Enter a start time"),
  clockOut: z.string().optional(),
  breakMinutes: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function logTimeEntryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = timeEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { crewMemberId, jobId, clockIn, clockOut, breakMinutes, notes } = parsed.data;

  const member = await prisma.crewMember.findFirst({
    where: { id: crewMemberId, crew: { organizationId: session.organizationId } },
  });
  if (!member) return { error: "Crew member not found" };

  const clockInDate = new Date(clockIn);
  if (Number.isNaN(clockInDate.getTime())) return { error: "Invalid start time" };
  const clockOutDate = clockOut ? new Date(clockOut) : null;
  if (clockOutDate && Number.isNaN(clockOutDate.getTime())) return { error: "Invalid end time" };
  if (clockOutDate && clockOutDate <= clockInDate) return { error: "End time must be after start time" };

  const breakMins = breakMinutes ? Number.parseInt(breakMinutes, 10) : 0;

  await prisma.timeEntry.create({
    data: {
      crewMemberId,
      jobId: jobId || null,
      clockIn: clockInDate,
      clockOut: clockOutDate,
      breakMinutes: Number.isFinite(breakMins) ? breakMins : 0,
      notes: notes || null,
    },
  });

  revalidatePath(`/crews/${member.crewId}/members/${crewMemberId}`);
}

const pieceRateSchema = z.object({
  crewMemberId: z.string().min(1),
  jobId: z.string().optional(),
  recordDate: z.string().min(1, "Choose a date"),
  unit: z.string().trim().min(1, "Enter a unit").max(50),
  quantity: z.string().min(1, "Enter a quantity"),
  ratePerUnit: z.string().min(1, "Enter a rate"),
  notes: z.string().trim().max(1000).optional(),
});

export async function logPieceRateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = pieceRateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { crewMemberId, jobId, recordDate, unit, quantity, ratePerUnit, notes } = parsed.data;

  const member = await prisma.crewMember.findFirst({
    where: { id: crewMemberId, crew: { organizationId: session.organizationId } },
  });
  if (!member) return { error: "Crew member not found" };

  const qty = Number.parseFloat(quantity);
  const rate = Number.parseFloat(ratePerUnit);
  if (!Number.isFinite(qty) || !Number.isFinite(rate)) return { error: "Invalid quantity or rate" };

  await prisma.pieceRateRecord.create({
    data: {
      crewMemberId,
      jobId: jobId || null,
      recordDate: new Date(recordDate),
      unit,
      quantity: qty,
      ratePerUnit: rate,
      amount: qty * rate,
      notes: notes || null,
    },
  });

  revalidatePath(`/crews/${member.crewId}/members/${crewMemberId}`);
}
