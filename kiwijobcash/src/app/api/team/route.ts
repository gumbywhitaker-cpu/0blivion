import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { sendEmail, escapeHtml } from "@/lib/email";
import { getPlan } from "@/lib/plans";
import { ALL_ROLES } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const { business } = await requireApiBusiness("team:manage");
    const members = await prisma.businessMember.findMany({
      where: { businessId: business.id },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ members });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "READ_ONLY"]),
});

export async function POST(req: Request) {
  try {
    const { business, membership } = await requireApiBusiness("team:manage");
    const body = await req.json().catch(() => null);
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const { name, email, role } = parsed.data;
    if (!ALL_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const [subscription, memberCount] = await Promise.all([
      prisma.subscription.findUnique({ where: { businessId: business.id } }),
      prisma.businessMember.count({ where: { businessId: business.id } }),
    ]);
    const plan = getPlan(subscription?.plan);
    if (memberCount >= plan.userLimit) {
      return NextResponse.json(
        { error: `The ${plan.name} plan is limited to ${plan.userLimit} team member${plan.userLimit === 1 ? "" : "s"}. Upgrade to add more.` },
        { status: 402 }
      );
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const existingMembership = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId: business.id, userId: user.id } },
      });
      if (existingMembership) {
        return NextResponse.json(
          { error: "That person is already on your team." },
          { status: 409 }
        );
      }
      const member = await prisma.businessMember.create({
        data: { businessId: business.id, userId: user.id, role, status: "ACTIVE" },
      });
      await writeAuditLog({
        businessId: business.id,
        userId: membership.userId,
        action: "team.member_added",
        entityType: "BusinessMember",
        entityId: member.id,
        metadata: { email, role },
      });
      await sendEmail({
        to: user.email,
        subject: `You've been added to ${business.name} on Kiwi Job Cash`,
        html: `<p>${escapeHtml(user.name)}, you've been added to <strong>${escapeHtml(business.name)}</strong> on Kiwi Job Cash as ${role.toLowerCase()}.</p>`,
      });
      return NextResponse.json({ member, invitedNewUser: false });
    }

    const passwordHash = await hashPassword(randomUUID());
    user = await prisma.user.create({ data: { name, email, passwordHash } });

    const member = await prisma.businessMember.create({
      data: { businessId: business.id, userId: user.id, role, status: "INVITED" },
    });

    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "team.member_invited",
      entityType: "BusinessMember",
      entityId: member.id,
      metadata: { email, role },
    });

    const setPasswordUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    const result = await sendEmail({
      to: email,
      subject: `You're invited to ${business.name} on Kiwi Job Cash`,
      html: `<p>You've been invited to join <strong>${escapeHtml(business.name)}</strong> on Kiwi Job Cash as ${role.toLowerCase()}.</p><p><a href="${setPasswordUrl}">Set your password to get started</a>. This link expires in 7 days.</p>`,
    });

    if (!result.delivered && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ member, invitedNewUser: true, devSetPasswordUrl: setPasswordUrl });
    }

    return NextResponse.json({ member, invitedNewUser: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
