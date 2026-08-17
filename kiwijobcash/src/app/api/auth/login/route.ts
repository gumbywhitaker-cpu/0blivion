import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { trackEvent } from "@/lib/events";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  if (user.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This account is suspended. Contact support." },
      { status: 403 }
    );
  }

  const membership = await prisma.businessMember.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  await setSessionCookie({
    userId: user.id,
    businessId: membership?.businessId ?? null,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await trackEvent("login", { businessId: membership?.businessId, userId: user.id });
  await writeAuditLog({
    businessId: membership?.businessId,
    userId: user.id,
    action: "user.login",
  });

  return NextResponse.json({
    ok: true,
    hasBusiness: Boolean(membership),
  });
}
