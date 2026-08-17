import "server-only";
import { prisma } from "@/lib/db";

export type ProfitRadar = {
  hasEnoughData: boolean;
  revenue: { last30: number; prior30: number; kind: "REPORTED" };
  costs: { last30: number; prior30: number; kind: "REPORTED" };
  grossProfit: { last30: number; kind: "REPORTED" };
  grossMargin: { last30: number | null; kind: "REPORTED" };
  avgJobValue: { value: number | null; kind: "REPORTED" };
  quoteConversionRate: { value: number | null; kind: "ESTIMATED" };
  leadConversionRate: { value: number | null; kind: "ESTIMATED" };
  outstandingInvoices: { value: number; kind: "REPORTED" };
  revenueByCustomer: { name: string; value: number }[];
  revenueByJobType: { type: string; value: number }[];
  revenueTrend: { month: string; revenue: number; cost: number }[];
  marginDeclining: boolean;
};

const DAY = 24 * 60 * 60 * 1000;

export async function computeProfitRadar(businessId: string): Promise<ProfitRadar> {
  const now = new Date();
  const last30Start = new Date(now.getTime() - 30 * DAY);
  const prior30Start = new Date(now.getTime() - 60 * DAY);

  const [completedJobs, priorJobs, expensesLast30, expensesPrior30, quotes, leads, unpaidInvoices, sixMonthJobs, sixMonthExpenses] =
    await Promise.all([
      prisma.job.findMany({
        where: { businessId, completedDate: { gte: last30Start, lte: now } },
        include: { customer: true },
      }),
      prisma.job.findMany({
        where: { businessId, completedDate: { gte: prior30Start, lt: last30Start } },
      }),
      prisma.expense.findMany({ where: { businessId, date: { gte: last30Start, lte: now } } }),
      prisma.expense.findMany({ where: { businessId, date: { gte: prior30Start, lt: last30Start } } }),
      prisma.quote.findMany({ where: { businessId, status: { in: ["ACCEPTED", "DECLINED", "EXPIRED"] } } }),
      prisma.lead.findMany({ where: { businessId, status: { in: ["WON", "LOST"] } } }),
      prisma.invoice.findMany({
        where: { businessId, status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] } },
        include: { payments: true },
      }),
      prisma.job.findMany({
        where: { businessId, completedDate: { gte: new Date(now.getTime() - 180 * DAY) } },
      }),
      prisma.expense.findMany({ where: { businessId, date: { gte: new Date(now.getTime() - 180 * DAY) } } }),
    ]);

  const hasEnoughData = completedJobs.length + priorJobs.length + expensesLast30.length > 0;

  const revenueLast30 = sum(completedJobs.map((j) => j.actualRevenue ?? j.quotedAmount ?? 0));
  const revenuePrior30 = sum(priorJobs.map((j) => j.actualRevenue ?? j.quotedAmount ?? 0));
  const jobCostsLast30 = sum(completedJobs.map((j) => j.labourCost + j.materialCost + j.otherCost));
  const expenseCostsLast30 = sum(expensesLast30.map((e) => e.amount));
  const jobCostsPrior30 = sum(priorJobs.map((j) => j.labourCost + j.materialCost + j.otherCost));
  const expenseCostsPrior30 = sum(expensesPrior30.map((e) => e.amount));

  const costsLast30 = jobCostsLast30 + expenseCostsLast30;
  const costsPrior30 = jobCostsPrior30 + expenseCostsPrior30;
  const grossProfitLast30 = revenueLast30 - costsLast30;
  const marginLast30 = revenueLast30 > 0 ? (grossProfitLast30 / revenueLast30) * 100 : null;
  const marginPrior30 =
    revenuePrior30 > 0 ? ((revenuePrior30 - costsPrior30) / revenuePrior30) * 100 : null;

  const resolvedQuotes = quotes.length;
  const quoteConversionRate =
    resolvedQuotes > 0 ? (quotes.filter((q) => q.status === "ACCEPTED").length / resolvedQuotes) * 100 : null;

  const resolvedLeads = leads.length;
  const leadConversionRate =
    resolvedLeads > 0 ? (leads.filter((l) => l.status === "WON").length / resolvedLeads) * 100 : null;

  const outstanding = sum(
    unpaidInvoices.map((i) => Math.max(0, i.amount - sum(i.payments.map((p) => p.amount))))
  );

  const byCustomer = new Map<string, number>();
  for (const job of completedJobs) {
    const key = job.customer.name;
    byCustomer.set(key, (byCustomer.get(key) ?? 0) + (job.actualRevenue ?? job.quotedAmount ?? 0));
  }
  const revenueByCustomer = [...byCustomer.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const byType = new Map<string, number>();
  for (const job of completedJobs) {
    const key = job.jobType ?? "Uncategorised";
    byType.set(key, (byType.get(key) ?? 0) + (job.actualRevenue ?? job.quotedAmount ?? 0));
  }
  const revenueByJobType = [...byType.entries()]
    .map(([type, value]) => ({ type, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  const trendMap = new Map<string, { revenue: number; cost: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendMap.set(monthKey(d), { revenue: 0, cost: 0 });
  }
  for (const job of sixMonthJobs) {
    if (!job.completedDate) continue;
    const key = monthKey(job.completedDate);
    const entry = trendMap.get(key);
    if (entry) {
      entry.revenue += job.actualRevenue ?? job.quotedAmount ?? 0;
      entry.cost += job.labourCost + job.materialCost + job.otherCost;
    }
  }
  for (const expense of sixMonthExpenses) {
    const key = monthKey(expense.date);
    const entry = trendMap.get(key);
    if (entry) entry.cost += expense.amount;
  }
  const revenueTrend = [...trendMap.entries()].map(([month, v]) => ({
    month,
    revenue: Math.round(v.revenue),
    cost: Math.round(v.cost),
  }));

  return {
    hasEnoughData,
    revenue: { last30: Math.round(revenueLast30), prior30: Math.round(revenuePrior30), kind: "REPORTED" },
    costs: { last30: Math.round(costsLast30), prior30: Math.round(costsPrior30), kind: "REPORTED" },
    grossProfit: { last30: Math.round(grossProfitLast30), kind: "REPORTED" },
    grossMargin: { last30: marginLast30 !== null ? Math.round(marginLast30) : null, kind: "REPORTED" },
    avgJobValue: {
      value: completedJobs.length > 0 ? Math.round(revenueLast30 / completedJobs.length) : null,
      kind: "REPORTED",
    },
    quoteConversionRate: {
      value: quoteConversionRate !== null ? Math.round(quoteConversionRate) : null,
      kind: "ESTIMATED",
    },
    leadConversionRate: {
      value: leadConversionRate !== null ? Math.round(leadConversionRate) : null,
      kind: "ESTIMATED",
    },
    outstandingInvoices: { value: Math.round(outstanding), kind: "REPORTED" },
    revenueByCustomer,
    revenueByJobType,
    revenueTrend,
    marginDeclining:
      marginLast30 !== null && marginPrior30 !== null && marginLast30 < marginPrior30 - 8,
  };
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

function monthKey(d: Date) {
  return d.toLocaleDateString("en-NZ", { month: "short", year: "2-digit" });
}
