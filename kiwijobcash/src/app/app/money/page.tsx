import { Suspense } from "react";
import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { computeMoneyAtRisk, computeMoneyRecovered } from "@/lib/money-engine";
import { computeProfitRadar } from "@/lib/profit";
import { MoneyCard, MetricCard } from "@/components/ui/MetricCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMoney, formatDate } from "@/lib/format";
import { TrendChart } from "@/components/app/money/TrendChart";
import { AddExpenseButton } from "@/components/app/money/AddExpenseButton";

export const metadata = { title: "Money" };

export default async function MoneyPage() {
  const { business } = await requireBusiness();

  const [moneyAtRisk, recovered, radar, recoveredActions] = await Promise.all([
    computeMoneyAtRisk(business.id),
    computeMoneyRecovered(business.id),
    computeProfitRadar(business.id),
    prisma.aIAction.findMany({
      where: { businessId: business.id, status: "COMPLETED", resultValue: { gt: 0 } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Money</h1>
          <p className="mt-1 text-muted">Your financial opportunity centre.</p>
        </div>
        <Suspense fallback={null}>
          <AddExpenseButton />
        </Suspense>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <MoneyCard
          label="Money at risk"
          amount={moneyAtRisk.total}
          hint="Estimated revenue and cash currently recoverable."
          breakdown={[
            { label: "Leads", amount: moneyAtRisk.leads },
            { label: "Quotes", amount: moneyAtRisk.quotes },
            { label: "Invoices", amount: moneyAtRisk.invoices },
            { label: "Dormant customers", amount: moneyAtRisk.dormantCustomers },
          ]}
        />
        <MoneyCard
          label="Money recovered"
          amount={recovered.total}
          hint={`${formatMoney(recovered.thisMonth)} this month, from ${recovered.count} confirmed win${recovered.count === 1 ? "" : "s"}.`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Outstanding invoices" value={formatMoney(radar.outstandingInvoices.value)} />
        <MetricCard
          label="Gross margin (30d)"
          value={radar.grossMargin.last30 !== null ? `${radar.grossMargin.last30}%` : "—"}
          hint="Reported"
        />
        <MetricCard
          label="Quote conversion"
          value={radar.quoteConversionRate.value !== null ? `${radar.quoteConversionRate.value}%` : "—"}
          hint="Estimated"
        />
        <MetricCard
          label="Avg job value"
          value={formatMoney(radar.avgJobValue.value)}
          hint="Reported, last 30 days"
        />
      </div>

      <div>
        <CardHeader
          title="Revenue vs cost"
          subtitle="Reported from completed jobs and logged expenses — last 6 months."
        />
        <Card>
          {radar.hasEnoughData ? (
            <TrendChart data={radar.revenueTrend} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              Complete a few jobs and log expenses to see your trend here.
            </p>
          )}
        </Card>
      </div>

      <div>
        <CardHeader title="Recovery history" subtitle="Confirmed wins from AI-recommended actions." />
        {recoveredActions.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              Nothing confirmed yet — when you mark a follow-up as won in the{" "}
              <Link href="/app/actions" className="text-brand hover:underline">
                Action Centre
              </Link>
              , it&apos;ll show up here.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="divide-y divide-border">
              {recoveredActions.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted">
                      {formatDate(a.completedAt)} · <Badge tone="neutral">{a.type.replace(/_/g, " ")}</Badge>
                    </p>
                  </div>
                  <span className="tabular-nums font-medium text-money">{formatMoney(a.resultValue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
