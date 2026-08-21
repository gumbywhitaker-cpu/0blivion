"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { emitEvent } from "@/lib/conductor/emit";

export type FormState = { error?: string } | undefined;

const onboardSchema = z.object({
  token: z.string().min(1),
  orgName: z.string().trim().min(2, "Business name is too short").max(200),
  name: z.string().trim().min(2, "Your name is too short").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  crewMembers: z.string().trim().max(4000).optional(),
});

function parseCrewMembers(raw: string | undefined): { name: string; phone?: string }[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 50)
    .map((line) => {
      const [name, phone] = line.split(",").map((s) => s.trim());
      return { name: name || line, phone: phone || undefined };
    });
}

export async function onboardAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = onboardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { token, orgName, name, email, phone, password, crewMembers } = parsed.data;

  const invite = await prisma.onboardingInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return { error: "This invite link is no longer valid. Ask the grower to send a new one." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with that email already exists — log in instead." };
  }

  const passwordHash = await hashPassword(password);
  const crew = parseCrewMembers(crewMembers);

  const { user, contractorOrg } = await prisma.$transaction(async (tx) => {
    const contractorOrg = await tx.organization.create({
      data: { name: orgName, type: "CONTRACTOR" },
    });
    const user = await tx.user.create({
      data: {
        organizationId: contractorOrg.id,
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "OWNER",
      },
    });
    await tx.contractorLink.create({
      data: {
        growerOrgId: invite.organizationId,
        contractorOrgId: contractorOrg.id,
        status: "ACTIVE",
      },
    });
    if (crew.length > 0) {
      const newCrew = await tx.crew.create({
        data: { organizationId: contractorOrg.id, name: `${orgName} crew` },
      });
      await tx.crewMember.createMany({
        data: crew.map((m) => ({ crewId: newCrew.id, name: m.name, phone: m.phone })),
      });
    }
    await tx.onboardingInvite.update({
      where: { id: invite.id },
      data: { status: "USED", usedAt: new Date() },
    });
    return { user, contractorOrg };
  });

  await emitEvent(invite.organizationId, {
    type: "CONTRACTOR_ONBOARDED",
    payload: { contractorOrgId: contractorOrg.id, growerOrgId: invite.organizationId },
  });

  await setSessionCookie({
    userId: user.id,
    organizationId: contractorOrg.id,
    orgType: "CONTRACTOR",
    role: "OWNER",
    name: user.name,
    email: user.email,
  });

  redirect("/dashboard");
}
