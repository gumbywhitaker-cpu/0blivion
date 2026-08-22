"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrGenerateBriefing } from "@/lib/dailyBriefing";
import { recordAuditLog } from "@/lib/audit";

export type FormState = { error?: string } | undefined;

export async function generateBriefingAction(_prevState: FormState, _formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "GROWER" && session.orgType !== "CONTRACTOR") {
    return { error: "The daily briefing is only available for grower and contractor accounts." };
  }

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: session.organizationId } });
  const result = await getOrGenerateBriefing(session.organizationId, session.orgType, org.name, true);
  if ("error" in result) return { error: result.error };

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "daily_briefing.generated",
    entityType: "DailyBriefing",
    entityId: session.organizationId,
    detail: { modelId: result.modelId },
  });

  revalidatePath("/briefing");
  return undefined;
}
