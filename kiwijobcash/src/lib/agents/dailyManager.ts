import "server-only";
import { prisma } from "@/lib/db";
import { computeMoneyAtRisk } from "@/lib/money-engine";

export type DailySummary = {
  moneyAtRisk: number;
  topOpportunity: { title: string; value: number } | null;
  overdueTotal: number;
  leadsNeedingAttention: number;
  topActions: { title: string; description: string; estimatedValue: number | null }[];
};

/**
 * Assembles the "Good morning" summary and the Daily Report — built entirely
 * from PENDING AIAction records and real invoice data, never invented.
 */
export async function computeDailySummary(businessId: string): Promise<DailySummary> {
  const [moneyAtRisk, pendingActions, overdueInvoices] = await Promise.all([
    computeMoneyAtRisk(businessId),
    prisma.aIAction.findMany({
      where: { businessId, status: "PENDING" },
      orderBy: [{ priority: "desc" }, { estimatedValue: "desc" }],
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { businessId, status: "OVERDUE" },
      include: { payments: true },
    }),
  ]);

  const overdueTotal = Math.round(
    overdueInvoices.reduce(
      (sum, inv) => sum + Math.max(0, inv.amount - inv.payments.reduce((p, x) => p + x.amount, 0)),
      0
    )
  );

  const leadsNeedingAttention = pendingActions.filter((a) => a.type === "LEAD_FOLLOWUP").length;

  const top = pendingActions[0];

  return {
    moneyAtRisk: moneyAtRisk.total,
    topOpportunity: top ? { title: top.title, value: top.estimatedValue ?? 0 } : null,
    overdueTotal,
    leadsNeedingAttention,
    topActions: pendingActions.slice(0, 3).map((a) => ({
      title: a.title,
      description: a.description,
      estimatedValue: a.estimatedValue,
    })),
  };
}
