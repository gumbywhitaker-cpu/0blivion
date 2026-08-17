import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { sendEmail, escapeHtml } from "@/lib/email";
import { trackEvent } from "@/lib/events";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });

    const business = await tx.business.create({
      data: {
        ownerUserId: user.id,
        name: `${name.split(" ")[0]}'s Business`,
      },
    });

    await tx.businessMember.create({
      data: { businessId: business.id, userId: user.id, role: "OWNER" },
    });

    await tx.subscription.create({
      data: { businessId: business.id, plan: "FREE", status: "ACTIVE" },
    });

    await tx.automationSettings.create({
      data: { businessId: business.id },
    });

    const verifyToken = randomUUID();
    await tx.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verifyToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
      },
    });

    return { user, business, verifyToken };
  });

  await setSessionCookie({
    userId: result.user.id,
    businessId: result.business.id,
  });

  await trackEvent("signup_completed", {
    businessId: result.business.id,
    userId: result.user.id,
  });
  await writeAuditLog({
    businessId: result.business.id,
    userId: result.user.id,
    action: "user.signup",
    entityType: "User",
    entityId: result.user.id,
  });

  const verifyUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/verify-email?token=${result.verifyToken}`;
  await sendEmail({
    to: result.user.email,
    subject: "Verify your Kiwi Job Cash account",
    html: `<p>Kia ora ${escapeHtml(result.user.name)},</p><p>Confirm your email to finish setting up Kiwi Job Cash:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  return NextResponse.json({
    ok: true,
    userId: result.user.id,
    businessId: result.business.id,
  });
}
