"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatMoney, formatDate } from "@/lib/format";
import { ActionCard, type ActionCardData } from "@/components/app/ActionCard";

type Payment = { id: string; amount: number; paymentDate: Date; method: string | null; reference: string | null };
type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  dueDate: Date;
  notes: string | null;
  customer: { id: string; name: string };
  payments: Payment[];
};

export function InvoiceDetailClient({
  invoice,
  relatedAction,
}: {
  invoice: Invoice;
  relatedAction: ActionCardData | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, invoice.amount - paid);

  const [amount, setAmount] = React.useState(balance > 0 ? String(balance) : "");
  const [method, setMethod] = React.useState("BANK_TRANSFER");
  const [saving, setSaving] = React.useState(false);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error ?? "Couldn't record that payment.", "error");
        return;
      }
      push(data.status === "PAID" ? "Invoice fully paid!" : "Payment recorded.", "success");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              For{" "}
              <Link href={`/app/customers/${invoice.customer.id}`} className="text-brand hover:underline">
                {invoice.customer.name}
              </Link>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase text-muted">Balance owing</p>
            <p className="text-2xl font-semibold tabular-nums text-money">{formatMoney(balance)}</p>
            <p className="text-xs text-muted">of {formatMoney(invoice.amount)}</p>
          </div>
        </div>

        {invoice.notes && <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-muted">{invoice.notes}</p>}

        <div className="mt-5 border-t border-border pt-4 text-sm">
          <p className="text-muted">Due date</p>
          <p className="mt-0.5 font-medium">{formatDate(invoice.dueDate)}</p>
        </div>
      </Card>

      {balance > 0 && (
        <Card>
          <CardHeader title="Record a payment" />
          <form onSubmit={recordPayment} className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <FormField label="Amount ($)" htmlFor="pay-amount">
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormField>
            <FormField label="Method" htmlFor="pay-method">
              <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>
            <Button type="submit" loading={saving}>
              Record payment
            </Button>
          </form>
        </Card>
      )}

      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader title="Payment history" />
          <div className="divide-y divide-border">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted">
                  {formatDate(p.paymentDate)} — {p.method?.replace("_", " ") ?? "Payment"}
                </span>
                <span className="font-medium tabular-nums">{formatMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {relatedAction && (
        <div>
          <CardHeader title="AI recommendation" />
          <ActionCard action={relatedAction} onChanged={() => router.refresh()} />
        </div>
      )}
    </div>
  );
}
