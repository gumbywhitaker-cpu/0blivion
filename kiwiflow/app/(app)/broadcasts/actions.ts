"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { notifyOrg } from "@/lib/notify";
import { recordAuditLog } from "@/lib/audit";
import { NOTIFICATION_URGENCIES } from "@/lib/types";

export type FormState = { error?: string } | undefined;

const sendBroadcastSchema = z.object({
  title: z.string().trim().min(2, "Add a title").max(200),
  body: z.string().trim().min(2, "Add a message").max(2000),
  urgency: z.enum(NOTIFICATION_URGENCIES),
  // Comes in as one or more form fields named recipientOrgIds
  recipientOrgIds: z.union([z.string(), z.array(z.string())]),
});

export async function sendBroadcastAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "GROWER") {
    return { error: "Only grower organisations can send broadcasts" };
  }
  assertCanManage(session.role);

  const parsed = sendBroadcastSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    urgency: formData.get("urgency"),
    recipientOrgIds: formData.getAll("recipientOrgIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { title, body, urgency } = parsed.data;
  const recipientOrgIds = Array.isArray(parsed.data.recipientOrgIds)
    ? parsed.data.recipientOrgIds
    : [parsed.data.recipientOrgIds];

  if (recipientOrgIds.length === 0) {
    return { error: "Choose at least one contractor to notify" };
  }

  // Recipients must actually be this grower's own ACTIVE-linked contractors —
  // never trust the posted org IDs on their own, same pattern as job/material
  // actions scoping every write to session.organizationId.
  const links = await prisma.contractorLink.findMany({
    where: { growerOrgId: session.organizationId, contractorOrgId: { in: recipientOrgIds }, status: "ACTIVE" },
  });
  if (links.length !== recipientOrgIds.length) {
    return { error: "One or more selected contractors aren't linked to your organisation" };
  }

  const broadcast = await prisma.broadcast.create({
    data: {
      organizationId: session.organizationId,
      createdById: session.userId,
      title,
      body,
      urgency,
      recipients: { create: links.map((l) => ({ organizationId: l.contractorOrgId })) },
    },
  });

  for (const link of links) {
    await notifyOrg({
      organizationId: link.contractorOrgId,
      title: `Broadcast: ${title}`,
      body,
      urgency,
    });
  }

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "broadcast.sent",
    entityType: "Broadcast",
    entityId: broadcast.id,
    detail: { recipientCount: links.length, urgency },
  });

  revalidatePath("/broadcasts");
}
