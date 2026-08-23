"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { recordAuditLog } from "@/lib/audit";

export async function disconnectXeroAction(): Promise<void> {
  const session = await requireSession();
  assertCanManage(session.role);

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: { xeroTenantId: null, xeroAccessToken: null, xeroRefreshToken: null, xeroTokenExpires: null },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "xero.disconnected",
    entityType: "Organization",
    entityId: session.organizationId,
  });

  revalidatePath("/settings");
}
