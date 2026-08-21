"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  setSessionCookie,
  clearSessionCookie,
  setMfaPendingCookie,
  getMfaPendingUserId,
  clearMfaPendingCookie,
} from "@/lib/auth/session";
import {
  isLockedOut,
  recordLoginAttempt,
  LOCKOUT_MESSAGE,
  getClientIpForRateLimit,
  isSignupRateLimited,
  recordSignupAttempt,
  SIGNUP_RATE_LIMIT_MESSAGE,
} from "@/lib/auth/rateLimit";
import { verifyTotp } from "@/lib/auth/totp";
import { ORG_TYPES, SELF_SERVE_ORG_TYPES } from "@/lib/types";

export type FormState = { error?: string } | undefined;

const signupSchema = z.object({
  orgName: z.string().trim().min(2, "Organisation name is too short").max(200),
  // Validated against the self-serve subset, not the full ORG_TYPES — ADMIN must
  // never be reachable by posting a crafted orgType value to this action.
  orgType: z.enum(SELF_SERVE_ORG_TYPES),
  name: z.string().trim().min(2, "Your name is too short").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { orgName, orgType, name, email, password } = parsed.data;

  const ip = await getClientIpForRateLimit();
  if (await isSignupRateLimited(ip)) {
    return { error: SIGNUP_RATE_LIMIT_MESSAGE };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  await recordSignupAttempt(ip);
  const passwordHash = await hashPassword(password);

  const { user, organization } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: orgName, type: orgType },
    });
    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        name,
        email,
        passwordHash,
        role: "OWNER",
      },
    });
    return { user, organization };
  });

  await setSessionCookie({
    userId: user.id,
    organizationId: organization.id,
    orgType: organization.type as (typeof ORG_TYPES)[number],
    role: "OWNER",
    name: user.name,
    email: user.email,
  });

  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password } = parsed.data;

  if (await isLockedOut(email)) {
    return { error: LOCKOUT_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });
  const valid = !!user && (await verifyPassword(password, user.passwordHash));
  await recordLoginAttempt(email, valid);
  if (!valid) {
    return { error: "Incorrect email or password" };
  }

  if (user.totpEnabled) {
    await setMfaPendingCookie(user.id);
    redirect("/login/verify-mfa");
  }

  await setSessionCookie({
    userId: user.id,
    organizationId: user.organizationId,
    orgType: user.organization.type as (typeof ORG_TYPES)[number],
    role: user.role as "OWNER" | "MANAGER" | "FIELD" | "DRIVER" | "VIEWER",
    name: user.name,
    email: user.email,
  });

  redirect("/dashboard");
}

const verifyMfaSchema = z.object({
  code: z.string().trim().min(6, "Enter the 6-digit code or a backup code"),
});

export async function verifyMfaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const pendingUserId = await getMfaPendingUserId();
  if (!pendingUserId) {
    redirect("/login");
  }

  const parsed = verifyMfaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { code } = parsed.data;

  // Rate-limited the same way as password attempts (docs/BLUEPRINT.md Section
  // 24) — a 6-digit TOTP code is far more brute-forceable than a password if
  // left unguarded, and this is the second factor protecting every account.
  const user = await prisma.user.findUnique({ where: { id: pendingUserId }, include: { organization: true } });
  if (!user || !user.totpEnabled || !user.totpSecret) {
    await clearMfaPendingCookie();
    redirect("/login");
  }
  if (await isLockedOut(`mfa:${user.email}`)) {
    return { error: LOCKOUT_MESSAGE };
  }

  let valid = verifyTotp(user.totpSecret, code);

  // Backup codes are 10 hex chars, never a bare 6-digit string, so a wrong
  // TOTP guess (the common case) skips straight past this rather than paying
  // for 8 sequential bcrypt compares (~3s of CPU-bound work) on every typo.
  const looksLikeBackupCode = !/^\d{6}$/.test(code);
  if (!valid && looksLikeBackupCode && user.totpBackupCodes) {
    const backupCodes: string[] = JSON.parse(user.totpBackupCodes);
    for (let i = 0; i < backupCodes.length; i++) {
      if (await verifyPassword(code.toUpperCase(), backupCodes[i]!)) {
        valid = true;
        // Single-use: remove it immediately so it can't be replayed.
        backupCodes.splice(i, 1);
        await prisma.user.update({ where: { id: user.id }, data: { totpBackupCodes: JSON.stringify(backupCodes) } });
        break;
      }
    }
  }

  await recordLoginAttempt(`mfa:${user.email}`, valid);
  if (!valid) {
    return { error: "That code didn't work. Try again." };
  }

  await clearMfaPendingCookie();
  await setSessionCookie({
    userId: user.id,
    organizationId: user.organizationId,
    orgType: user.organization.type as (typeof ORG_TYPES)[number],
    role: user.role as "OWNER" | "MANAGER" | "FIELD" | "DRIVER" | "VIEWER",
    name: user.name,
    email: user.email,
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
