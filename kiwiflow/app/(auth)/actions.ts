"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { ORG_TYPES } from "@/lib/types";

export type FormState = { error?: string } | undefined;

const signupSchema = z.object({
  orgName: z.string().trim().min(2, "Organisation name is too short").max(200),
  orgType: z.enum(ORG_TYPES),
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

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

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Incorrect email or password" };
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

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
