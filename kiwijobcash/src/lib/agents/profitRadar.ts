import "server-only";
import { computeProfitRadar } from "@/lib/profit";
import type { ActionCandidate } from "@/lib/agents/types";

/**
 * Unlike the other agents, this one looks at business-wide trends rather
 * than a single record, so it uses the business itself as the entity.
 */
export async function runProfitRadarAgent(businessId: string): Promise<ActionCandidate[]> {
  const radar = await computeProfitRadar(businessId);
  if (!radar.hasEnoughData || !radar.marginDeclining || radar.grossMargin.last30 === null) {
    return [];
  }

  return [
    {
      type: "PROFIT_ALERT",
      entityType: "Business",
      entityId: businessId, // business-level alert; not tied to one job record
      title: "Gross margin is trending down",
      description: `Gross margin over the last 30 days is ${radar.grossMargin.last30}%, down from the prior 30 days.`,
      estimatedValue: null,
      priority: "MEDIUM",
      aiReasoningSummary: `Revenue and costs over the last 30 completed jobs and expenses show margin declining by more than 8 points versus the prior 30 days. Check Reports for the breakdown by customer and job type.`,
      suggestedMessage: null,
    },
  ];
}
