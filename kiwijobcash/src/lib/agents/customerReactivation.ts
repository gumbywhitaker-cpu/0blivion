import "server-only";
import { prisma } from "@/lib/db";
import { daysBetween } from "@/lib/format";
import type { ActionCandidate } from "@/lib/agents/types";

export async function runCustomerReactivationAgent(businessId: string): Promise<ActionCandidate[]> {
  const settings = await prisma.automationSettings.findUnique({ where: { businessId } });
  const dormantDays = settings?.customerReactivationDays ?? 180;

  const customers = await prisma.customer.findMany({
    where: { businessId, customerStatus: { in: ["ACTIVE", "VIP"] } },
  });

  const now = new Date();
  const candidates: ActionCandidate[] = [];

  for (const customer of customers) {
    const lastActivity = latest(customer.lastJobDate, customer.lastContactDate);
    if (!lastActivity) continue;
    const daysSince = daysBetween(now, lastActivity);
    if (daysSince < dormantDays) continue;

    const avgJobValue = customer.totalJobs > 0 ? customer.lifetimeValue / customer.totalJobs : null;
    const months = Math.round(daysSince / 30);

    candidates.push({
      type: "CUSTOMER_REACTIVATION",
      entityType: "Customer",
      entityId: customer.id,
      customerId: customer.id,
      title: customer.name,
      description: `Hasn't used your service in ${months} month${months === 1 ? "" : "s"}`,
      estimatedValue: avgJobValue,
      priority: avgJobValue && avgJobValue >= 500 ? "MEDIUM" : "LOW",
      aiReasoningSummary: avgJobValue
        ? `Last activity ${months} months ago. Historical average job value is $${Math.round(avgJobValue)}.`
        : `Last activity ${months} months ago. Not enough job history to estimate a likely value.`,
      suggestedMessage: `Hey ${firstName(customer.name)}, it's been a while since we've heard from you. If you've got anything needing a hand with, give us a shout. Cheers.`,
    });
  }

  return candidates;
}

function latest(...dates: (Date | null)[]) {
  const valid = dates.filter((d): d is Date => d !== null);
  if (valid.length === 0) return null;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

function firstName(name: string) {
  return name.split(" ")[0];
}
