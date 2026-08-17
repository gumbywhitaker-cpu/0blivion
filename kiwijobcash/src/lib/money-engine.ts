import "server-only";
import { prisma } from "@/lib/db";

export type MoneyAtRisk = {
  leads: number;
  quotes: number;
  invoices: number;
  dormantCustomers: number;
  total: number;
};

/**
 * Every number here is derived directly from real records for the business —
 * never fabricated. Zero-record categories contribute 0, they don't get
 * estimated or guessed.
 */
export async function computeMoneyAtRisk(businessId: string): Promise<MoneyAtRisk> {
  const [openLeads, openQuotes, unpaidInvoices, dormantCustomers] = await Promise.all([
    prisma.lead.findMany({
      where: { businessId, status: { in: ["NEW", "CONTACTED", "QUALIFIED", "QUOTED"] } },
      select: { estimatedValue: true },
    }),
    prisma.quote.findMany({
      where: { businessId, status: { in: ["SENT", "VIEWED", "FOLLOW_UP"] } },
      select: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { businessId, status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] } },
      select: { amount: true, payments: { select: { amount: true } } },
    }),
    prisma.customer.findMany({
      where: {
        businessId,
        customerStatus: { in: ["ACTIVE", "VIP", "AT_RISK"] },
      },
      select: { lifetimeValue: true, totalJobs: true, lastJobDate: true, lastContactDate: true },
    }),
  ]);

  const settings = await prisma.automationSettings.findUnique({ where: { businessId } });
  const dormantDays = settings?.customerReactivationDays ?? 180;
  const dormantCutoff = new Date(Date.now() - dormantDays * 24 * 60 * 60 * 1000);

  const leads = round(openLeads.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0));
  const quotes = round(openQuotes.reduce((sum, q) => sum + q.amount, 0));
  const invoices = round(
    unpaidInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((p, payment) => p + payment.amount, 0);
      return sum + Math.max(0, inv.amount - paid);
    }, 0)
  );

  const dormant = dormantCustomers.filter((c) => {
    const lastActivity = latest(c.lastJobDate, c.lastContactDate);
    return lastActivity ? lastActivity < dormantCutoff : false;
  });
  const dormantValue = round(
    dormant.reduce((sum, c) => {
      const avgJob = c.totalJobs > 0 ? c.lifetimeValue / c.totalJobs : 0;
      return sum + avgJob;
    }, 0)
  );

  return {
    leads,
    quotes,
    invoices,
    dormantCustomers: dormantValue,
    total: leads + quotes + invoices + dormantValue,
  };
}

function latest(...dates: (Date | null)[]) {
  const valid = dates.filter((d): d is Date => d !== null);
  if (valid.length === 0) return null;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

function round(n: number) {
  return Math.round(n);
}

export type RecoveryScoreResult =
  | { available: false; reason: string }
  | {
      available: true;
      score: number;
      opportunityCount: number;
      opportunityValue: number;
    };

/**
 * 0-100 transparency score. Built from four equally-weighted signals, each
 * only counted once there's enough data to judge it. If none of the signals
 * have enough data, we say so instead of inventing a number.
 */
export async function computeRecoveryScore(businessId: string): Promise<RecoveryScoreResult> {
  const [leads, quotes, invoices, customers] = await Promise.all([
    prisma.lead.findMany({ where: { businessId } }),
    prisma.quote.findMany({ where: { businessId } }),
    prisma.invoice.findMany({ where: { businessId } }),
    prisma.customer.count({ where: { businessId } }),
  ]);

  if (leads.length === 0 && quotes.length === 0 && invoices.length === 0 && customers === 0) {
    return {
      available: false,
      reason: "Connect your business data to unlock your full score.",
    };
  }

  const signals: number[] = [];
  let opportunityCount = 0;
  let opportunityValue = 0;

  // Lead responsiveness: share of open leads that have been contacted at least once.
  const openLeads = leads.filter((l) => !["WON", "LOST", "DORMANT"].includes(l.status));
  if (openLeads.length > 0) {
    const contacted = openLeads.filter((l) => l.lastContactedAt).length;
    signals.push((contacted / openLeads.length) * 100);
    const stale = openLeads.filter((l) => !l.lastContactedAt);
    opportunityCount += stale.length;
    opportunityValue += stale.reduce((s, l) => s + (l.estimatedValue ?? 0), 0);
  }

  // Quote conversion: accepted vs. resolved (accepted + declined + expired).
  const resolvedQuotes = quotes.filter((q) =>
    ["ACCEPTED", "DECLINED", "EXPIRED"].includes(q.status)
  );
  if (resolvedQuotes.length > 0) {
    const accepted = resolvedQuotes.filter((q) => q.status === "ACCEPTED").length;
    signals.push((accepted / resolvedQuotes.length) * 100);
  }
  const openQuotes = quotes.filter((q) => ["SENT", "VIEWED", "FOLLOW_UP"].includes(q.status));
  opportunityCount += openQuotes.length;
  opportunityValue += openQuotes.reduce((s, q) => s + q.amount, 0);

  // Invoice health: share of issued invoices that are not currently overdue.
  const issuedInvoices = invoices.filter((i) => i.status !== "DRAFT");
  if (issuedInvoices.length > 0) {
    const healthy = issuedInvoices.filter((i) => i.status !== "OVERDUE" && i.status !== "BAD_DEBT");
    signals.push((healthy.length / issuedInvoices.length) * 100);
    const overdue = issuedInvoices.filter((i) => i.status === "OVERDUE");
    opportunityCount += overdue.length;
    opportunityValue += overdue.reduce((s, i) => s + i.amount, 0);
  }

  if (signals.length === 0) {
    return {
      available: false,
      reason: "Connect your business data to unlock your full score.",
    };
  }

  const score = Math.round(signals.reduce((a, b) => a + b, 0) / signals.length);

  return {
    available: true,
    score,
    opportunityCount,
    opportunityValue: Math.round(opportunityValue),
  };
}

export async function computeMoneyRecovered(businessId: string) {
  const completed = await prisma.aIAction.findMany({
    where: { businessId, status: "COMPLETED", resultValue: { not: null } },
    select: { resultValue: true, type: true, createdAt: true, customerId: true },
  });

  const total = completed.reduce((sum, a) => sum + (a.resultValue ?? 0), 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = completed
    .filter((a) => a.createdAt >= startOfMonth)
    .reduce((sum, a) => sum + (a.resultValue ?? 0), 0);

  const byType: Record<string, number> = {};
  for (const a of completed) {
    byType[a.type] = (byType[a.type] ?? 0) + (a.resultValue ?? 0);
  }

  return {
    total: Math.round(total),
    thisMonth: Math.round(thisMonth),
    byType,
    count: completed.length,
  };
}
