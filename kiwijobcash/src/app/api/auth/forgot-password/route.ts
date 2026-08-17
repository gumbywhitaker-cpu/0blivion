import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always respond the same way to avoid leaking which emails have accounts.
  const genericResponse = {
    ok: true,
    message: "If that email has an account, we've sent a reset link.",
  };

  if (!user) return NextResponse.json(genericResponse);

  const token = randomUUID();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  const resetUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  const result = await sendEmail({
    to: user.email,
    subject: "Reset your Kiwi Job Cash password",
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
  });

  // Dev convenience only: surface the link when no email provider is configured,
  // so the flow is testable without an inbox. Never enabled in production.
  if (!result.delivered && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ...genericResponse, devResetUrl: resetUrl });
  }

  return NextResponse.json(genericResponse);
}
