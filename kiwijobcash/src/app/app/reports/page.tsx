import { requireBusiness } from "@/lib/session";
import { computeProfitRadar } from "@/lib/profit";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/format";
import { TrendChart } from "@/components/app/money/TrendChart";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { business } = await requireBusiness();
  const radar = await computeProfitRadar(business.id);

  if (!radar.hasEnoughData) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profit Radar</h1>
          <p className="mt-1 text-muted">Revenue, costs and margin — from your own completed jobs.</p>
        </div>
        <Card>
          <p className="text-sm text-muted">
            Not enough data to estimate profit yet. Complete a few jobs and log some expenses, and
            Profit Radar will start showing revenue, margin and trends here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Profit Radar</h1>
        <p className="mt-1 text-muted">
          Revenue and margin are <Badge tone="success">Reported</Badge> from completed jobs and
          logged expenses. Conversion rates are <Badge tone="info">Estimated</Badge>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Revenue (30d)" value={formatMoney(radar.revenue.last30)} />
        <MetricCard label="Costs (30d)" value={formatMoney(radar.costs.last30)} />
        <MetricCard
          label="Gross profit (30d)"
          value={formatMoney(radar.grossProfit.last30)}
          tone="brand"
        />
        <MetricCard
          label="Gross margin"
          value={radar.grossMargin.last30 !== null ? `${radar.grossMargin.last30}%` : "—"}
          tone={radar.marginDeclining ? "danger" : "default"}
          hint={radar.marginDeclining ? "Declining vs prior 30 days" : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Avg job value" value={formatMoney(radar.avgJobValue.value)} hint="Reported" />
        <MetricCard
          label="Quote conversion"
          value={radar.quoteConversionRate.value !== null ? `${radar.quoteConversionRate.value}%` : "—"}
          hint="Estimated"
        />
        <MetricCard
          label="Lead conversion"
          value={radar.leadConversionRate.value !== null ? `${radar.leadConversionRate.value}%` : "—"}
          hint="Estimated"
        />
        <MetricCard label="Outstanding invoices" value={formatMoney(radar.outstandingInvoices.value)} />
      </div>

      <div>
        <CardHeader title="Revenue vs cost — last 6 months" subtitle="Reported" />
        <Card>
          <TrendChart data={radar.revenueTrend} />
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <CardHeader title="Revenue by customer" subtitle="Top 8, last 30 days" />
          <Card>
            {radar.revenueByCustomer.length === 0 ? (
              <p className="text-sm text-muted">No completed jobs in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {radar.revenueByCustomer.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{c.name}</span>
                    <span className="font-medium tabular-nums">{formatMoney(c.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div>
          <CardHeader title="Revenue by job type" subtitle="Last 30 days" />
          <Card>
            {radar.revenueByJobType.length === 0 ? (
              <p className="text-sm text-muted">No completed jobs in this period.</p>
            ) : (
              <div className="space-y-2.5">
                {radar.revenueByJobType.map((t) => (
                  <div key={t.type} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{t.type}</span>
                    <span className="font-medium tabular-nums">{formatMoney(t.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
