"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatMoney, formatDate } from "@/lib/format";
import { ActionCard, type ActionCardData } from "@/components/app/ActionCard";
import { Briefcase } from "lucide-react";

type Quote = {
  id: string;
  quoteNumber: string;
  status: string;
  amount: number;
  description: string | null;
  issueDate: Date;
  expiryDate: Date | null;
  customerId: string;
  customer: { id: string; name: string };
};

export function QuoteDetailClient({
  quote,
  relatedAction,
}: {
  quote: Quote;
  relatedAction: ActionCardData | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [saving, setSaving] = React.useState(false);

  async function setStatus(status: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      push(
        status === "ACCEPTED" ? "Quote marked as accepted!" : "Quote updated.",
        "success"
      );
      router.refresh();
    } catch {
      push("Couldn't update the quote.", "error");
    } finally {
      setSaving(false);
    }
  }

  const isOpen = ["DRAFT", "SENT", "VIEWED", "FOLLOW_UP"].includes(quote.status);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{quote.quoteNumber}</h1>
              <StatusBadge status={quote.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              For{" "}
              <Link href={`/app/customers/${quote.customer.id}`} className="text-brand hover:underline">
                {quote.customer.name}
              </Link>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase text-muted">Amount</p>
            <p className="text-2xl font-semibold tabular-nums text-money">{formatMoney(quote.amount)}</p>
          </div>
        </div>

        {quote.description && (
          <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-muted">{quote.description}</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
          <div>
            <p className="text-muted">Issued</p>
            <p className="mt-0.5 font-medium">{formatDate(quote.issueDate)}</p>
          </div>
          <div>
            <p className="text-muted">Expires</p>
            <p className="mt-0.5 font-medium">{formatDate(quote.expiryDate)}</p>
          </div>
        </div>

        {isOpen && (
          <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
            <Button size="sm" onClick={() => setStatus("ACCEPTED")} loading={saving}>
              Mark accepted
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("DECLINED")} loading={saving}>
              Mark declined
            </Button>
          </div>
        )}

        {quote.status === "ACCEPTED" && (
          <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
            <Button
              href={`/app/jobs?new=1&customerId=${quote.customer.id}&quoteId=${quote.id}`}
              size="sm"
              variant="outline"
              icon={<Briefcase className="size-4" />}
            >
              Create job from this quote
            </Button>
          </div>
        )}
      </Card>

      {relatedAction && (
        <div>
          <CardHeader title="AI recommendation" />
          <ActionCard action={relatedAction} onChanged={() => router.refresh()} />
        </div>
      )}
    </div>
  );
}
