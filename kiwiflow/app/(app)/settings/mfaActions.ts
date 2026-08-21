"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateTotpSecret, verifyTotp, generateBackupCodes } from "@/lib/auth/totp";
import { recordAuditLog } from "@/lib/audit";

export type MfaFormState = { error?: string; backupCodes?: string[] } | undefined;

/** Generates a fresh secret and stores it, but leaves totpEnabled false — the
 * settings page renders the QR code from this secret; nothing is "on" until
 * confirmMfaAction proves the user's authenticator actually reads it. */
export async function startMfaSetupAction(): Promise<void> {
  const session = await requireSession();
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: session.userId },
    data: { totpSecret: secret, totpEnabled: false, totpBackupCodes: null },
  });
  revalidatePath("/settings");
}

const confirmSchema = z.object({ code: z.string().trim().min(6, "Enter the 6-digit code") });

export async function confirmMfaAction(_prev: MfaFormState, formData: FormData): Promise<MfaFormState> {
  const session = await requireSession();
  const parsed = confirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.totpSecret) {
    return { error: "Start setup first." };
  }
  if (!verifyTotp(user.totpSecret, parsed.data.code)) {
    return { error: "That code didn't match. Check your authenticator app and try again." };
  }

  const backupCodes = generateBackupCodes();
  const hashedCodes = await Promise.all(backupCodes.map((c) => hashPassword(c)));

  await prisma.user.update({
    where: { id: session.userId },
    data: { totpEnabled: true, totpBackupCodes: JSON.stringify(hashedCodes) },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "mfa.enabled",
    entityType: "User",
    entityId: session.userId,
  });

  // Deliberately NOT calling revalidatePath here. It would refresh the parent
  // server component (enabled: true) and swap MfaSettings to the "disable"
  // view before the user has a chance to see these codes — they're shown
  // exactly once, from this return value, and the client owns dismissing this
  // view (see MfaSettings' onEnabled/newBackupCodes). The DB write above is
  // already durable; the next real page load will reflect it regardless.
  return { backupCodes };
}

const disableSchema = z.object({
  password: z.string().min(1, "Enter your password"),
  code: z.string().trim().min(6, "Enter your current 6-digit code"),
});

export async function disableMfaAction(_prev: MfaFormState, formData: FormData): Promise<MfaFormState> {
  const session = await requireSession();
  const parsed = disableSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "User not found" };

  // Defense in depth: disabling MFA requires BOTH factors again, not just an
  // active session — a stolen/left-open session alone can't silently turn
  // protection off.
  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
  const codeOk = user.totpSecret ? verifyTotp(user.totpSecret, parsed.data.code) : false;
  if (!passwordOk || !codeOk) {
    return { error: "Password or code was incorrect." };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { totpEnabled: false, totpSecret: null, totpBackupCodes: null },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "mfa.disabled",
    entityType: "User",
    entityId: session.userId,
  });

  revalidatePath("/settings");
  return undefined;
}
