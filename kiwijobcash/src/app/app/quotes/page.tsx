import { Suspense } from "react";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatMoney, daysBetween } from "@/lib/format";
import { quoteHeatBucket } from "@/lib/agents/quoteRecovery";
import { QuotesListClient, type QuoteRow } from "@/components/app/quotes/QuotesListClient";

export const metadata = { title: "Quotes" };

export default async function QuotesPage() {
  const { business } = await requireBusiness();

  const [quotes, customers] = await Promise.all([
    prisma.quote.findMany({ where: { businessId: business.id }, include: { customer: true }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const open = quotes.filter((q) => ["SENT", "VIEWED", "FOLLOW_UP"].includes(q.status));
  const resolved = quotes.filter((q) => ["ACCEPTED", "DECLINED", "EXPIRED"].includes(q.status));
  const accepted = resolved.filter((q) => q.status === "ACCEPTED");

  const potentialRevenue = open.reduce((s, q) => s + q.amount, 0);
  const avgQuoteValue = quotes.length > 0 ? quotes.reduce((s, q) => s + q.amount, 0) / quotes.length : 0;
  const conversionRate = resolved.length > 0 ? (accepted.length / resolved.length) * 100 : null;
  const now = new Date();
  const avgDaysWaiting =
    open.length > 0 ? open.reduce((s, q) => s + daysBetween(now, q.issueDate), 0) / open.length : 0;

  const rows: QuoteRow[] = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    status: q.status,
    amount: q.amount,
    issueDate: q.issueDate.toISOString(),
    customerName: q.customer.name,
    heat: ["SENT", "VIEWED", "FOLLOW_UP"].includes(q.status)
      ? quoteHeatBucket(daysBetween(now, q.issueDate))
      : null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Quote recovery</h1>
        <p className="mt-1 text-muted">Chase quotes before they go cold.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Awaiting response" value={open.length} tone="brand" />
        <MetricCard label="Potential revenue" value={formatMoney(potentialRevenue)} tone="brand" />
        <MetricCard label="Avg quote value" value={formatMoney(avgQuoteValue)} />
        <MetricCard
          label="Conversion rate"
          value={conversionRate !== null ? `${Math.round(conversionRate)}%` : "—"}
          hint={conversionRate === null ? "Not enough resolved quotes yet" : `Avg ${Math.round(avgDaysWaiting)} days waiting`}
        />
      </div>

      <Suspense fallback={null}>
        <QuotesListClient quotes={rows} customers={customers} />
      </Suspense>
    </div>
  );
}
