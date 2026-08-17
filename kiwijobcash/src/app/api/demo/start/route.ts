import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { seedDemoData } from "@/lib/demo-seed";
import { trackEvent } from "@/lib/events";

/**
 * Spins up a fresh, isolated demo business ("Dave's Plumbing") with
 * realistic fictional data and logs the visitor straight in — no signup
 * required. Every visitor gets their own demo business so nobody's poking
 * around breaks anyone else's session.
 */
export async function POST() {
  const uniqueId = randomUUID().slice(0, 8);
  const passwordHash = await hashPassword(randomUUID());

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: "Dave (Demo)",
        email: `demo-${uniqueId}@kiwijobcash.demo`,
        passwordHash,
      },
    });

    const business = await tx.business.create({
      data: {
        ownerUserId: user.id,
        name: "Dave's Plumbing",
        businessType: "Plumbing",
        industry: "Plumbing",
        employeeCount: "4–6",
        averageJobValue: 650,
        monthlyRevenueRange: "25K_50K",
        isDemo: true,
        onboardingCompleted: true,
      },
    });

    await tx.businessMember.create({
      data: { businessId: business.id, userId: user.id, role: "OWNER" },
    });

    await tx.subscription.create({
      data: { businessId: business.id, plan: "PRO", status: "ACTIVE" },
    });

    await tx.automationSettings.create({ data: { businessId: business.id } });

    return { user, business };
  });

  await seedDemoData(result.business.id);

  await setSessionCookie({ userId: result.user.id, businessId: result.business.id });
  await trackEvent("demo_started", { businessId: result.business.id, userId: result.user.id });

  return NextResponse.json({ ok: true });
}
