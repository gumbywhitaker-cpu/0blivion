import Link from "next/link";
import { prisma } from "@/lib/db";
import { getPlan, PLANS } from "@/lib/plans";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMoney, formatDate, daysAgo } from "@/lib/format";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  const [
    totalBusinesses,
    demoBusinesses,
    newThisWeek,
    newThisMonth,
    totalUsers,
    subscriptions,
    recoveredAgg,
    aiActionsSentCount,
    openSupportCount,
    recentBusinesses,
  ] = await Promise.all([
    prisma.business.count({ where: { isDemo: false } }),
    prisma.business.count({ where: { isDemo: true } }),
    prisma.business.count({ where: { isDemo: false, createdAt: { gte: sevenDaysAgo } } }),
    prisma.business.count({ where: { isDemo: false, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count(),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true } }),
    prisma.aIAction.aggregate({ where: { status: "COMPLETED" }, _sum: { resultValue: true } }),
    prisma.aIAction.count({ where: { status: { in: ["SENT", "COMPLETED"] } } }),
    prisma.supportRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.business.findMany({
      where: { isDemo: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { owner: { select: { email: true, name: true } }, subscription: true },
    }),
  ]);

  const planCounts = new Map<string, number>();
  for (const sub of subscriptions) {
    planCounts.set(sub.plan, (planCounts.get(sub.plan) ?? 0) + 1);
  }

  const mrr = PLANS.reduce((sum, plan) => sum + plan.priceMonthlyNzd * (planCounts.get(plan.id) ?? 0), 0);
  const totalMoneyRecovered = recoveredAgg._sum.resultValue ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="mt-1 text-muted">Platform-wide metrics across every business.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Businesses" value={totalBusinesses} hint={`${demoBusinesses} demo sessions`} />
        <MetricCard label="MRR" value={formatMoney(mrr)} hint="From active paid subscriptions" tone="brand" />
        <MetricCard label="New this week" value={newThisWeek} hint={`${newThisMonth} in the last 30 days`} />
        <MetricCard label="Total users" value={totalUsers} />
        <MetricCard
          label="Money recovered"
          value={formatMoney(totalMoneyRecovered)}
          hint="Platform-wide, all time"
          tone="brand"
        />
        <MetricCard label="AI actions sent" value={aiActionsSentCount} />
        <MetricCard label="Open support requests" value={openSupportCount} tone={openSupportCount > 0 ? "danger" : "default"} />
      </div>

      <Card>
        <CardHeader title="Plan mix" subtitle="Active subscriptions by plan" />
        <div className="grid gap-3 sm:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-muted">{plan.name}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {planCounts.get(plan.id) ?? 0}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Recent signups"
          action={
            <Link href="/admin/businesses" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          }
        />
        <div className="divide-y divide-border">
          {recentBusinesses.map((b) => {
            const plan = getPlan(b.subscription?.plan);
            return (
              <Link
                key={b.id}
                href={`/admin/businesses/${b.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{b.name}</p>
                  <p className="truncate text-sm text-muted">{b.owner.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone="neutral">{plan.name}</Badge>
                  <span className="text-sm text-muted">{formatDate(b.createdAt)}</span>
                </div>
              </Link>
            );
          })}
          {recentBusinesses.length === 0 && <p className="py-6 text-center text-sm text-muted">No businesses yet.</p>}
        </div>
      </Card>
    </div>
  );
}
