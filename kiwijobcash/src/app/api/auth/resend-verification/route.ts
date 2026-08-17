import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const token = randomUUID();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
    },
  });

  const verifyUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/verify-email?token=${token}`;
  const result = await sendEmail({
    to: user.email,
    subject: "Verify your Kiwi Job Cash account",
    html: `<p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  return NextResponse.json({
    ok: true,
    devVerifyUrl:
      !result.delivered && process.env.NODE_ENV !== "production" ? verifyUrl : undefined,
  });
}
