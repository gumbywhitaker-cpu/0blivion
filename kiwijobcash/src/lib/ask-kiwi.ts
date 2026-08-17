import "server-only";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { computeMoneyAtRisk, computeRecoveryScore } from "@/lib/money-engine";
import { computeProfitRadar } from "@/lib/profit";
import { polishWithLLM } from "@/lib/llm";

export type AskKiwiAnswer = {
  answer: string;
  period: string;
  sourceCount: number;
};

/**
 * Ask Kiwi answers from the business's own authorized data only — every
 * branch below queries Prisma scoped to businessId before saying anything.
 * If a question doesn't match a known intent, we say so rather than
 * guessing. The LLM (when configured) only rewords the deterministic
 * answer already built from real numbers — it never generates numbers
 * itself.
 */
export async function answerBusinessQuestion(
  businessId: string,
  question: string
): Promise<AskKiwiAnswer> {
  const q = question.toLowerCase();
  const period = "the last 30 days";

  let built: { answer: string; sourceCount: number };

  if (/(owe|overdue|unpaid|invoice)/.test(q)) {
    built = await whoOwesMoney(businessId);
  } else if (/(quote|chase)/.test(q)) {
    built = await quotesToChase(businessId);
  } else if (/(best|top).*(customer)/.test(q)) {
    built = await bestCustomers(businessId);
  } else if (/(losing money|money at risk|leak)/.test(q)) {
    built = await moneyAtRisk(businessId);
  } else if (/(today|what should i do|priorit)/.test(q)) {
    built = await todaysActions(businessId);
  } else if (/(profit|margin|why is my)/.test(q)) {
    built = await profitSummary(businessId);
  } else if (/(recovery score|how am i doing)/.test(q)) {
    built = await recoveryScoreSummary(businessId);
  } else {
    built = {
      answer:
        "I can answer questions about who owes you money, which quotes to chase, your best customers, where you're losing money, today's priorities, and your profit. Try asking one of those.",
      sourceCount: 0,
    };
  }

  const polished = await polishWithLLM({
    system:
      "You are Ask Kiwi, the assistant inside Kiwi Job Cash, a revenue-recovery tool for NZ tradies. " +
      "Rewrite the following answer in a friendly, direct, plain-English Kiwi tone — short sentences, no corporate jargon. " +
      "Do NOT add, remove, or change any numbers, names, or facts. Do NOT invent anything not in the original text. " +
      "Keep it roughly the same length.",
    prompt: built.answer,
    maxTokens: 300,
  });

  return {
    answer: polished ?? built.answer,
    period,
    sourceCount: built.sourceCount,
  };
}

async function whoOwesMoney(businessId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { businessId, status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] } },
    include: { customer: true, payments: true },
    orderBy: { dueDate: "asc" },
  });
  const withBalance = invoices
    .map((i) => ({
      ...i,
      balance: Math.max(0, i.amount - i.payments.reduce((s, p) => s + p.amount, 0)),
    }))
    .filter((i) => i.balance > 0);

  if (withBalance.length === 0) {
    return { answer: "Nobody currently owes you money — every invoice is paid up. Nice work.", sourceCount: 0 };
  }

  const total = withBalance.reduce((s, i) => s + i.balance, 0);
  const top = withBalance.slice(0, 5);
  const lines = top
    .map((i) => `- ${i.customer.name}: ${formatMoney(i.balance)} (${i.invoiceNumber})`)
    .join("\n");

  return {
    answer: `Based on your recorded invoices, ${withBalance.length} customer(s) owe you a total of ${formatMoney(total)}:\n${lines}`,
    sourceCount: withBalance.length,
  };
}

async function quotesToChase(businessId: string) {
  const quotes = await prisma.quote.findMany({
    where: { businessId, status: { in: ["SENT", "VIEWED", "FOLLOW_UP"] } },
    include: { customer: true },
    orderBy: { amount: "desc" },
  });

  if (quotes.length === 0) {
    return { answer: "You have no quotes currently waiting on a response.", sourceCount: 0 };
  }

  const total = quotes.reduce((s, q) => s + q.amount, 0);
  const top = quotes.slice(0, 5);
  const lines = top
    .map((q) => `- ${q.customer.name}: ${formatMoney(q.amount)} (${q.quoteNumber})`)
    .join("\n");

  return {
    answer: `You have ${quotes.length} quote(s) awaiting a response, worth ${formatMoney(total)} in total. Highest value first:\n${lines}`,
    sourceCount: quotes.length,
  };
}

async function bestCustomers(businessId: string) {
  const customers = await prisma.customer.findMany({
    where: { businessId, lifetimeValue: { gt: 0 } },
    orderBy: { lifetimeValue: "desc" },
    take: 5,
  });

  if (customers.length === 0) {
    return {
      answer: "Not enough job history recorded yet to rank your best customers.",
      sourceCount: 0,
    };
  }

  const lines = customers
    .map((c) => `- ${c.name}: ${formatMoney(c.lifetimeValue)} lifetime, ${c.totalJobs} job(s)`)
    .join("\n");

  return {
    answer: `Based on recorded lifetime value, your top customers are:\n${lines}`,
    sourceCount: customers.length,
  };
}

async function moneyAtRisk(businessId: string) {
  const risk = await computeMoneyAtRisk(businessId);
  if (risk.total === 0) {
    return { answer: "Nothing sitting at risk right now — your leads, quotes and invoices are all up to date.", sourceCount: 0 };
  }
  return {
    answer:
      `Based on your recorded data, you have ${formatMoney(risk.total)} of estimated recoverable revenue: ` +
      `${formatMoney(risk.leads)} in leads, ${formatMoney(risk.quotes)} in open quotes, ` +
      `${formatMoney(risk.invoices)} in unpaid invoices, and ${formatMoney(risk.dormantCustomers)} from dormant customers.`,
    sourceCount: 1,
  };
}

async function todaysActions(businessId: string) {
  const actions = await prisma.aIAction.findMany({
    where: { businessId, status: "PENDING" },
    orderBy: [{ priority: "desc" }, { estimatedValue: "desc" }],
    take: 3,
  });

  if (actions.length === 0) {
    return { answer: "Nothing urgent in your Action Centre right now — you're on top of things.", sourceCount: 0 };
  }

  const lines = actions
    .map((a, i) => `${i + 1}. ${a.title} — ${a.description}${a.estimatedValue ? ` (${formatMoney(a.estimatedValue)})` : ""}`)
    .join("\n");

  return {
    answer: `Here's what's worth doing today, based on your Action Centre:\n${lines}`,
    sourceCount: actions.length,
  };
}

async function profitSummary(businessId: string) {
  const radar = await computeProfitRadar(businessId);
  if (!radar.hasEnoughData) {
    return {
      answer: "Not enough completed jobs and expenses recorded yet to estimate your profit.",
      sourceCount: 0,
    };
  }
  const marginLine =
    radar.grossMargin.last30 !== null
      ? `Your gross margin over the last 30 days is ${radar.grossMargin.last30}% (reported from completed jobs and logged expenses).`
      : "Not enough data yet to calculate a margin.";
  const trendLine = radar.marginDeclining
    ? " That's down more than 8 points versus the prior 30 days — worth a look at Reports."
    : "";
  return {
    answer: `${marginLine}${trendLine} Revenue was ${formatMoney(radar.revenue.last30)} and costs were ${formatMoney(radar.costs.last30)} over the same period.`,
    sourceCount: 1,
  };
}

async function recoveryScoreSummary(businessId: string) {
  const score = await computeRecoveryScore(businessId);
  if (!score.available) {
    return { answer: score.reason, sourceCount: 0 };
  }
  return {
    answer: `Your Money Recovery Score is ${score.score}/100. There ${score.opportunityCount === 1 ? "is" : "are"} ${score.opportunityCount} opportunit${score.opportunityCount === 1 ? "y" : "ies"} worth approximately ${formatMoney(score.opportunityValue)} sitting unattended.`,
    sourceCount: 1,
  };
}
