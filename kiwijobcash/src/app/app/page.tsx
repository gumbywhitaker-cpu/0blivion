import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { computeMoneyAtRisk, computeRecoveryScore, computeMoneyRecovered } from "@/lib/money-engine";
import { runAgents } from "@/lib/agents/run";
import { formatMoney } from "@/lib/format";
import { MoneyCard, MetricCard } from "@/components/ui/MetricCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { ActionsFeed } from "@/components/app/ActionsFeed";
import { PlusCircle, Upload, PlayCircle, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const { user, business } = await requireBusiness();

  const hasAnyData = await businessHasAnyRecords(business.id);
  if (hasAnyData) {
    await runAgents(business.id).catch((err) => console.error("Agent run failed:", err));
  }

  const [moneyAtRisk, recoveryScore, recovered, pendingActions] = await Promise.all([
    computeMoneyAtRisk(business.id),
    computeRecoveryScore(business.id),
    computeMoneyRecovered(business.id),
    prisma.aIAction.findMany({
      where: { businessId: business.id, status: "PENDING" },
      orderBy: [{ priority: "desc" }, { estimatedValue: "desc" }],
      take: 5,
    }),
  ]);

  const firstName = user.name.split(" ")[0];
  const greeting = getGreeting();

  if (!hasAnyData) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-1 text-muted">Let&apos;s find your first money leak.</p>
        <EmptyState
          className="mt-6"
          icon={<Sparkles className="size-6" />}
          title="No business data yet"
          description="Add your first customer, lead, quote or invoice — or import a spreadsheet — and Kiwi Job Cash will start finding real opportunities."
          action={
            <Button href="/app/customers?new=1" icon={<PlusCircle className="size-4" />}>
              Add customer
            </Button>
          }
          secondaryAction={
            <>
              <Button href="/app/integrations" variant="outline" icon={<Upload className="size-4" />}>
                Import CSV
              </Button>
              <Button href="/app?demo=1" variant="ghost" icon={<PlayCircle className="size-4" />}>
                Try demo data
              </Button>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-1 text-muted">Here&apos;s what&apos;s worth chasing today.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
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
        </div>
        <RecoveryScoreCard result={recoveryScore} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <MetricCard
          label="Money recovered this month"
          value={<span className="tabular-nums">{formatMoney(recovered.thisMonth)}</span>}
          hint={`${formatMoney(recovered.total)} all-time`}
          tone="brand"
        />
        <MetricCard
          label="Open opportunities"
          value={pendingActions.length}
          hint={<Link href="/app/actions" className="text-brand hover:underline">View Action Centre</Link>}
        />
      </div>

      <div>
        <CardHeader
          title="Fix these first"
          subtitle="Your highest-value opportunities right now."
          action={
            <Button href="/app/actions" variant="outline" size="sm">
              View all
            </Button>
          }
        />
        <ActionsFeed actions={pendingActions} />
      </div>
    </div>
  );
}

function RecoveryScoreCard({
  result,
}: {
  result: Awaited<ReturnType<typeof computeRecoveryScore>>;
}) {
  if (!result.available) {
    return (
      <Card>
        <p className="text-sm font-medium text-muted">Money Recovery Score</p>
        <p className="mt-3 text-sm text-muted">{result.reason}</p>
      </Card>
    );
  }
  return (
    <Card>
      <p className="text-sm font-medium text-muted">Money Recovery Score</p>
      <p className="mt-2 text-4xl font-semibold tabular-nums text-foreground">
        {result.score}
        <span className="text-lg text-muted">/100</span>
      </p>
      <p className="mt-2 text-sm text-muted">
        {result.opportunityCount > 0
          ? `You're doing well, but there ${result.opportunityCount === 1 ? "is" : "are"} ${result.opportunityCount} opportunit${result.opportunityCount === 1 ? "y" : "ies"} worth approximately ${formatMoney(result.opportunityValue)}.`
          : "Nice work — no major opportunities sitting unattended right now."}
      </p>
    </Card>
  );
}

async function businessHasAnyRecords(businessId: string) {
  const [customers, leads, quotes, invoices] = await Promise.all([
    prisma.customer.count({ where: { businessId } }),
    prisma.lead.count({ where: { businessId } }),
    prisma.quote.count({ where: { businessId } }),
    prisma.invoice.count({ where: { businessId } }),
  ]);
  return customers + leads + quotes + invoices > 0;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
