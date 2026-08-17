import "server-only";
import { prisma } from "@/lib/db";
import { daysBetween } from "@/lib/format";
import { priorityFromValue, type ActionCandidate } from "@/lib/agents/types";

/** HOT/WARM/COLD bucketing used on the Quote Recovery dashboard too. */
export function quoteHeatBucket(daysSinceIssue: number): "HOT" | "WARM" | "COLD" {
  if (daysSinceIssue <= 3) return "HOT";
  if (daysSinceIssue <= 10) return "WARM";
  return "COLD";
}

export async function runQuoteRecoveryAgent(businessId: string): Promise<ActionCandidate[]> {
  const settings = await prisma.automationSettings.findUnique({ where: { businessId } });
  const firstReminderDays = settings?.quoteReminderDays1 ?? 3;

  const quotes = await prisma.quote.findMany({
    where: { businessId, status: { in: ["SENT", "VIEWED", "FOLLOW_UP"] } },
    include: { customer: true },
  });

  const now = new Date();
  const candidates: ActionCandidate[] = [];

  for (const quote of quotes) {
    const lastTouch = quote.lastFollowupAt ?? quote.issueDate;
    const daysSinceTouch = daysBetween(now, lastTouch);
    const daysSinceIssue = daysBetween(now, quote.issueDate);

    if (daysSinceTouch < firstReminderDays) continue;

    const heat = quoteHeatBucket(daysSinceIssue);
    candidates.push({
      type: "QUOTE_FOLLOWUP",
      entityType: "Quote",
      entityId: quote.id,
      customerId: quote.customerId,
      quoteId: quote.id,
      title: quote.customer.name,
      description: `${quote.quoteNumber} — ${quote.description ?? "Quote"}`,
      estimatedValue: quote.amount,
      priority: priorityFromValue(quote.amount, daysSinceIssue),
      aiReasoningSummary: `Sent ${daysSinceIssue} day${daysSinceIssue === 1 ? "" : "s"} ago and hasn't been followed up since. Worth ${Math.round(quote.amount)} NZD (${heat.toLowerCase()}).`,
      suggestedMessage: `Hi ${quote.customer.name}, just checking in on the quote we sent through${quote.description ? ` for ${lowerFirst(quote.description)}` : ""}. Happy to answer any questions or make changes if needed. Cheers.`,
    });
  }

  return candidates;
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
