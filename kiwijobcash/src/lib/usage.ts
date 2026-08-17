import "server-only";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getUsage(businessId: string) {
  const month = currentMonth();
  const usage = await prisma.usage.upsert({
    where: { businessId_month: { businessId, month } },
    update: {},
    create: { businessId, month },
  });
  const subscription = await prisma.subscription.findUnique({ where: { businessId } });
  const plan = getPlan(subscription?.plan);
  return { usage, plan, month };
}

export type UsageMetric = "aiActions" | "aiMessages" | "emailsSent" | "smsSent" | "scans" | "apiCalls";

export async function canUseAiAction(businessId: string) {
  const { usage, plan } = await getUsage(businessId);
  return {
    allowed: usage.aiActions < plan.aiActionsPerMonth,
    used: usage.aiActions,
    limit: plan.aiActionsPerMonth,
    percentUsed: Math.round((usage.aiActions / plan.aiActionsPerMonth) * 100),
  };
}

export async function incrementUsage(businessId: string, metrics: Partial<Record<UsageMetric, number>>) {
  const month = currentMonth();
  await prisma.usage.upsert({
    where: { businessId_month: { businessId, month } },
    update: Object.fromEntries(
      Object.entries(metrics).map(([k, v]) => [k, { increment: v ?? 1 }])
    ),
    create: { businessId, month, ...metrics },
  });
}
