"use client";

import * as React from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CheckCircle2 } from "lucide-react";
import type { Plan, PlanId } from "@/lib/plans";

export function BillingClient({
  canManage,
  currentPlanId,
  status,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  hasStripeCustomer,
  stripeConfigured,
  plans,
  usage,
}: {
  canManage: boolean;
  currentPlanId: PlanId;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  stripeConfigured: boolean;
  plans: (Plan & { priced: boolean })[];
  usage: { aiActions: number; aiActionsLimit: number };
}) {
  const toast = useToast();
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = React.useState(false);

  const currentPlan = plans.find((p) => p.id === currentPlanId) ?? plans[0];
  const percentUsed = Math.min(
    100,
    Math.round((usage.aiActions / usage.aiActionsLimit) * 100)
  );

  async function upgrade(planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Couldn't start checkout.", "error");
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoadingPlan(null);
    }
  }

  async function manageBilling() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Couldn't open billing portal.", "error");
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <div className="space-y-6">
      {!stripeConfigured && (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-4 text-sm text-muted">
          Billing isn&apos;t connected to Stripe in this environment yet. Plan changes and payments
          aren&apos;t available until it&apos;s configured — everything else works normally on the Free plan.
        </div>
      )}

      <Card>
        <CardHeader
          title="Current plan"
          action={<StatusBadge status={status} />}
        />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold text-foreground">{currentPlan.name}</p>
            <p className="mt-1 text-sm text-muted">
              {currentPlan.priceMonthlyNzd === 0
                ? "Free forever"
                : `${formatMoney(currentPlan.priceMonthlyNzd)} / month`}
              {cancelAtPeriodEnd && currentPeriodEnd && (
                <> — cancels on {formatDate(currentPeriodEnd)}</>
              )}
              {!cancelAtPeriodEnd && currentPeriodEnd && status === "ACTIVE" && (
                <> — renews {formatDate(currentPeriodEnd)}</>
              )}
            </p>
          </div>
          {canManage && hasStripeCustomer && (
            <Button variant="outline" onClick={manageBilling} loading={loadingPortal}>
              Manage billing
            </Button>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">AI actions this month</span>
            <span className="font-medium tabular-nums">
              {usage.aiActions} / {usage.aiActionsLimit}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                "h-full rounded-full",
                percentUsed >= 100 ? "bg-danger" : percentUsed >= 80 ? "bg-warning" : "bg-brand"
              )}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-foreground">Plans</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <Card key={plan.id} className={cn(isCurrent && "border-brand ring-1 ring-brand")}>
                <p className="font-semibold text-foreground">{plan.name}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {plan.priceMonthlyNzd === 0 ? "Free" : formatMoney(plan.priceMonthlyNzd)}
                  {plan.priceMonthlyNzd > 0 && (
                    <span className="text-sm font-normal text-muted"> /mo</span>
                  )}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {isCurrent ? (
                    <Button variant="secondary" fullWidth disabled>
                      Current plan
                    </Button>
                  ) : plan.priceMonthlyNzd === 0 ? (
                    <Button variant="outline" fullWidth disabled>
                      Cancel via Manage billing
                    </Button>
                  ) : canManage ? (
                    <Button
                      variant={plan.highlight ? "primary" : "outline"}
                      fullWidth
                      loading={loadingPlan === plan.id}
                      disabled={!plan.priced}
                      onClick={() => upgrade(plan.id)}
                    >
                      {!plan.priced ? "Not available yet" : "Upgrade"}
                    </Button>
                  ) : (
                    <p className="text-center text-xs text-muted">Ask an admin to change plan</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
