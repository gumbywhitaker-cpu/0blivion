import "server-only";
import { prisma } from "@/lib/db";
import { daysBetween } from "@/lib/format";
import { priorityFromValue, type ActionCandidate } from "@/lib/agents/types";

const STALE_AFTER_DAYS = 2;

/**
 * Finds leads that have gone quiet: never contacted, or overdue for their
 * next follow-up. Every candidate cites the exact lead record it came from.
 */
export async function runLeadRecoveryAgent(businessId: string): Promise<ActionCandidate[]> {
  const leads = await prisma.lead.findMany({
    where: { businessId, status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } },
    include: { customer: true },
  });

  const now = new Date();
  const candidates: ActionCandidate[] = [];

  for (const lead of leads) {
    const ageDays = daysBetween(now, lead.createdAt);
    const daysSinceContact = lead.lastContactedAt ? daysBetween(now, lead.lastContactedAt) : ageDays;
    const overdueFollowup = lead.nextFollowupAt ? lead.nextFollowupAt <= now : false;
    const neverContacted = !lead.lastContactedAt && ageDays >= STALE_AFTER_DAYS;

    if (!overdueFollowup && !neverContacted && daysSinceContact < STALE_AFTER_DAYS) continue;

    const contactName = lead.customer?.name ?? lead.name;
    const reason = neverContacted
      ? `This lead hasn't been contacted in ${ageDays} day${ageDays === 1 ? "" : "s"}.`
      : `Follow-up was due ${daysBetween(lead.nextFollowupAt ?? now, now)} day(s) ago.`;

    candidates.push({
      type: "LEAD_FOLLOWUP",
      entityType: "Lead",
      entityId: lead.id,
      customerId: lead.customerId,
      leadId: lead.id,
      title: contactName,
      description: lead.description ?? "New enquiry",
      estimatedValue: lead.estimatedValue,
      priority: priorityFromValue(lead.estimatedValue, daysSinceContact),
      aiReasoningSummary: `${reason}${lead.estimatedValue ? ` Estimated value ${Math.round(lead.estimatedValue)} NZD.` : ""}`,
      suggestedMessage: `Hi ${contactName}, thanks for getting in touch${lead.description ? ` about ${lowerFirst(lead.description)}` : ""}. Just following up — happy to answer any questions or get a time booked in. Cheers.`,
    });
  }

  return candidates;
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
