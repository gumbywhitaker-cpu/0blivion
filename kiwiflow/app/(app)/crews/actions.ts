"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";

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
});

export async function addCrewMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { crewId, name, phone } = parsed.data;

  const crew = await prisma.crew.findFirst({
    where: { id: crewId, organizationId: session.organizationId },
  });
  if (!crew) {
    return { error: "Crew not found" };
  }

  await prisma.crewMember.create({ data: { crewId, name, phone: phone || null } });
  revalidatePath(`/crews/${crewId}`);
}
