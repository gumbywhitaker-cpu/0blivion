"use client";

import * as React from "react";
import { Flame, TrendingUp, Receipt, UserCheck, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PriorityBadge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/format";
import { AIMessageModal } from "@/components/app/AIMessageModal";

export type ActionCardData = {
  id: string;
  type: string;
  title: string;
  description: string;
  estimatedValue: number | null;
  priority: string;
  aiReasoningSummary: string | null;
  suggestedMessage: string | null;
  entityType: string;
  entityId: string;
  customerId: string | null;
  leadId: string | null;
  quoteId: string | null;
  invoiceId: string | null;
};

const ICONS: Record<string, typeof Flame> = {
  LEAD_FOLLOWUP: Flame,
  QUOTE_FOLLOWUP: TrendingUp,
  INVOICE_CHASE: Receipt,
  CUSTOMER_REACTIVATION: UserCheck,
  PROFIT_ALERT: AlertTriangle,
  REVENUE_OPPORTUNITY: Sparkles,
  REVIEW_REQUEST: Sparkles,
  JOB_REVIEW: Sparkles,
  GENERAL_TASK: Sparkles,
};

const TYPE_LABEL: Record<string, string> = {
  LEAD_FOLLOWUP: "Hot lead",
  QUOTE_FOLLOWUP: "Quote follow-up",
  INVOICE_CHASE: "Overdue invoice",
  CUSTOMER_REACTIVATION: "Win back customer",
  PROFIT_ALERT: "Profit alert",
  REVENUE_OPPORTUNITY: "Revenue opportunity",
  REVIEW_REQUEST: "Review request",
  JOB_REVIEW: "Job review",
  GENERAL_TASK: "Task",
};

const DETAIL_HREF: Record<string, (a: ActionCardData) => string | null> = {
  LEAD_FOLLOWUP: (a) => (a.leadId ? `/app/leads/${a.leadId}` : null),
  QUOTE_FOLLOWUP: (a) => (a.quoteId ? `/app/quotes/${a.quoteId}` : null),
  INVOICE_CHASE: (a) => (a.invoiceId ? `/app/invoices/${a.invoiceId}` : null),
  CUSTOMER_REACTIVATION: (a) => (a.customerId ? `/app/customers/${a.customerId}` : null),
};

export function ActionCard({
  action,
  onChanged,
}: {
  action: ActionCardData;
  onChanged?: () => void;
}) {
  const [messageOpen, setMessageOpen] = React.useState(false);
  const Icon = ICONS[action.type] ?? Sparkles;
  const href = DETAIL_HREF[action.type]?.(action) ?? null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {TYPE_LABEL[action.type] ?? action.type}
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{action.title}</p>
            <p className="mt-0.5 text-sm text-muted">{action.description}</p>
          </div>
        </div>
        <PriorityBadge priority={action.priority} />
      </div>

      {action.estimatedValue !== null && (
        <p className="mt-3 text-2xl font-semibold tabular-nums text-money">
          {formatMoney(action.estimatedValue)}
        </p>
      )}

      {action.aiReasoningSummary && (
        <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
          {action.aiReasoningSummary}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {action.suggestedMessage && (
          <Button size="sm" onClick={() => setMessageOpen(true)}>
            {action.type === "INVOICE_CHASE" ? "Chase payment" : "Contact"}
          </Button>
        )}
        {href && (
          <Button size="sm" variant="outline" href={href}>
            View details
          </Button>
        )}
        <DismissButton actionId={action.id} onChanged={onChanged} />
      </div>

      {action.suggestedMessage && (
        <AIMessageModal
          key={action.id}
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          actionId={action.id}
          recipientName={action.title}
          initialMessage={action.suggestedMessage}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}

function DismissButton({ actionId, onChanged }: { actionId: string; onChanged?: () => void }) {
  const [loading, setLoading] = React.useState(false);
  async function dismiss() {
    setLoading(true);
    try {
      await fetch(`/api/ai-actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
      });
      onChanged?.();
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button size="sm" variant="ghost" onClick={dismiss} loading={loading}>
      Dismiss
    </Button>
  );
}
