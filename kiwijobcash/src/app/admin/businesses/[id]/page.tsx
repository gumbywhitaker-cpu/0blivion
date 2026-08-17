import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { getUsage } from "@/lib/usage";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

export const metadata = { title: "Business detail — Admin" };

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, email: true } },
      subscription: true,
      members: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { customers: true, leads: true, quotes: true, invoices: true, jobs: true } },
    },
  });
  if (!business) notFound();

  const [usageInfo, recentAudit, moneyRecovered] = await Promise.all([
    getUsage(business.id),
    prisma.auditLog.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.aIAction.aggregate({
      where: { businessId: business.id, status: "COMPLETED" },
      _sum: { resultValue: true },
    }),
  ]);

  const plan = getPlan(business.subscription?.plan);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{business.name}</h1>
          <p className="mt-1 text-muted">
            {business.owner.email} — created {formatDate(business.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {business.isDemo && <Badge tone="neutral">Demo</Badge>}
          <Badge tone="brand">{plan.name}</Badge>
          <StatusBadge status={business.subscription?.status ?? "ACTIVE"} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Customers" value={business._count.customers} />
        <MetricCard label="Leads / Quotes" value={`${business._count.leads} / ${business._count.quotes}`} />
        <MetricCard label="Invoices / Jobs" value={`${business._count.invoices} / ${business._count.jobs}`} />
        <MetricCard label="Money recovered" value={formatMoney(moneyRecovered._sum.resultValue ?? 0)} tone="brand" />
      </div>

      <Card>
        <CardHeader title="Usage this month" subtitle={usageInfo.month} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted">AI actions</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {usageInfo.usage.aiActions} / {plan.aiActionsPerMonth}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Emails sent</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{usageInfo.usage.emailsSent}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Money leak scans</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{usageInfo.usage.scans}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Team" subtitle={`${business.members.length} member${business.members.length === 1 ? "" : "s"}`} />
        <div className="divide-y divide-border">
          {business.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium text-foreground">{m.user.name}</p>
                <p className="text-muted">{m.user.email}</p>
              </div>
              <Badge tone="neutral">{ROLE_LABELS[m.role as Role] ?? m.role}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Recent activity" subtitle="Last 15 audit log entries" />
        <div className="divide-y divide-border">
          {recentAudit.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-foreground">{entry.action}</span>
              <span className="text-muted">{formatDateTime(entry.createdAt)}</span>
            </div>
          ))}
          {recentAudit.length === 0 && <p className="py-6 text-center text-sm text-muted">No activity yet.</p>}
        </div>
      </Card>
    </div>
  );
}
