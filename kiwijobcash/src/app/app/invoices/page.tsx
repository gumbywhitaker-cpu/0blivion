import { Suspense } from "react";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { refreshOverdueInvoices } from "@/lib/invoice-status";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatMoney, daysBetween } from "@/lib/format";
import { InvoicesListClient, type InvoiceRow } from "@/components/app/invoices/InvoicesListClient";

export const metadata = { title: "Invoices" };

const BUCKETS = [
  { label: "0–7 days", min: 0, max: 7 },
  { label: "8–14 days", min: 8, max: 14 },
  { label: "15–30 days", min: 15, max: 30 },
  { label: "31–60 days", min: 31, max: 60 },
  { label: "60+ days", min: 61, max: Infinity },
];

export default async function InvoicesPage() {
  const { business } = await requireBusiness();
  await refreshOverdueInvoices(business.id);

  const [invoices, customers] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId: business.id },
      include: { customer: true, payments: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const now = new Date();
  const withBalance = invoices.map((i) => ({
    ...i,
    balance: Math.max(0, i.amount - i.payments.reduce((s, p) => s + p.amount, 0)),
  }));

  const outstanding = withBalance.filter((i) => i.balance > 0 && i.status !== "DRAFT");
  const overdue = outstanding.filter((i) => i.status === "OVERDUE");
  const dueSoon = outstanding.filter(
    (i) => i.status !== "OVERDUE" && daysBetween(i.dueDate, now) <= 7 && i.dueDate >= now
  );

  const totalOutstanding = outstanding.reduce((s, i) => s + i.balance, 0);
  const totalOverdue = overdue.reduce((s, i) => s + i.balance, 0);
  const highestOverdue = overdue.reduce((max, i) => Math.max(max, i.balance), 0);
  const avgDelay =
    overdue.length > 0 ? overdue.reduce((s, i) => s + daysBetween(now, i.dueDate), 0) / overdue.length : 0;

  const bucketTotals = BUCKETS.map((bucket) => ({
    ...bucket,
    total: overdue
      .filter((i) => {
        const days = daysBetween(now, i.dueDate);
        return days >= bucket.min && days <= bucket.max;
      })
      .reduce((s, i) => s + i.balance, 0),
  }));

  const rows: InvoiceRow[] = withBalance.map((i) => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    status: i.status,
    amount: i.amount,
    balance: i.balance,
    dueDate: i.dueDate.toISOString(),
    customerName: i.customer.name,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Invoice recovery</h1>
        <p className="mt-1 text-muted">Get paid faster with the right reminder at the right time.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Total outstanding" value={formatMoney(totalOutstanding)} tone="brand" />
        <MetricCard label="Overdue" value={formatMoney(totalOverdue)} tone="danger" hint={`${overdue.length} invoices`} />
        <MetricCard label="Due soon" value={dueSoon.length} hint="Within 7 days" />
        <MetricCard
          label="Highest overdue"
          value={formatMoney(highestOverdue)}
          hint={overdue.length > 0 ? `Avg ${Math.round(avgDelay)} days late` : undefined}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-5 divide-x divide-border">
          {bucketTotals.map((b) => (
            <div key={b.label} className="p-4 text-center">
              <p className="text-xs font-medium text-muted">{b.label}</p>
              <p className="mt-1.5 text-lg font-semibold tabular-nums">{formatMoney(b.total)}</p>
            </div>
          ))}
        </div>
      </div>

      <Suspense fallback={null}>
        <InvoicesListClient invoices={rows} customers={customers} />
      </Suspense>
    </div>
  );
}
