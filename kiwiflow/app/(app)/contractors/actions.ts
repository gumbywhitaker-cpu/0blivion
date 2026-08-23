"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";

export type FormState = { error?: string } | undefined;

const INVITE_TTL_DAYS = 7;

export async function createInviteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "GROWER") {
    return { error: "Only grower organisations can invite contractors" };
  }
  assertCanManage(session.role);

  const contractorName = String(formData.get("contractorName") ?? "").trim() || undefined;

  await prisma.onboardingInvite.create({
    data: {
      organizationId: session.organizationId,
      token: randomUUID(),
      contractorName,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/contractors");
}

export async function suspendLinkAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  assertCanManage(session.role);
  const linkId = String(formData.get("linkId"));

  const link = await prisma.contractorLink.findFirst({
    where: { id: linkId, growerOrgId: session.organizationId },
  });
  if (!link) return;

  await prisma.contractorLink.update({
    where: { id: link.id },
    data: { status: link.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
  });
  revalidatePath("/contractors");
}
