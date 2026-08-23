"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { setMyobCompanyFileCredentials } from "@/lib/myob";
import { recordAuditLog } from "@/lib/audit";

export type FormState = { error?: string } | undefined;

export async function disconnectMyobAction(): Promise<void> {
  const session = await requireSession();
  assertCanManage(session.role);

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: {
      myobCompanyFileUid: null,
      myobAccessToken: null,
      myobRefreshToken: null,
      myobTokenExpires: null,
      myobCfUsername: null,
      myobCfPassword: null,
    },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "myob.disconnected",
    entityType: "Organization",
    entityId: session.organizationId,
  });

  revalidatePath("/settings");
}

const CredentialsSchema = z.object({
  myobCfUsername: z.string().trim().min(1, "Company file username is required."),
  myobCfPassword: z.string(), // MYOB allows a blank company-file password
});

/** The company file's own sign-in — a second, separate credential from the
 * OAuth connection (see lib/myob.ts's header comment for why MYOB needs
 * this). Set after connecting; a connection with no company-file password
 * set sends an empty one, matching MYOB's own public-sandbox convention. */
export async function setMyobCredentialsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = CredentialsSchema.safeParse({
    myobCfUsername: formData.get("myobCfUsername"),
    myobCfPassword: formData.get("myobCfPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await setMyobCompanyFileCredentials(session.organizationId, parsed.data.myobCfUsername, parsed.data.myobCfPassword);

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "myob.company_file_credentials_set",
    entityType: "Organization",
    entityId: session.organizationId,
  });

  revalidatePath("/settings");
  return undefined;
}
