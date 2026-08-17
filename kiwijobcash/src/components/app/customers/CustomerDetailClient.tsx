"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { FileText, Receipt, Briefcase, Users, Bot } from "lucide-react";

type Lead = { id: string; name: string; status: string; estimatedValue: number | null; createdAt: string | Date };
type Quote = { id: string; quoteNumber: string; status: string; amount: number; issueDate: string | Date };
type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  balance: number;
  dueDate: string | Date;
};
type Job = { id: string; jobNumber: string; title: string; status: string; actualRevenue: number | null };
type Action = { id: string; title: string; type: string; status: string; priority: string; estimatedValue: number | null };

export function CustomerDetailClient({
  customer,
  leads,
  quotes,
  invoices,
  jobs,
  aiActions,
}: {
  customer: { id: string; customerStatus: string; notes: string | null };
  leads: Lead[];
  quotes: Quote[];
  invoices: Invoice[];
  jobs: Job[];
  aiActions: Action[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [status, setStatus] = React.useState(customer.customerStatus);
  const [savingStatus, setSavingStatus] = React.useState(false);

  async function updateStatus(next: string) {
    setStatus(next);
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerStatus: next }),
      });
      if (!res.ok) throw new Error();
      push("Status updated.", "success");
      router.refresh();
    } catch {
      push("Couldn't update status.", "error");
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Status"
          action={
            <Select
              value={status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={savingStatus}
              className="w-auto"
            >
              {["ACTIVE", "VIP", "AT_RISK", "DORMANT", "ARCHIVED"].map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
          }
        />
      </Card>

      <Section
        icon={<Users className="size-4" />}
        title="Leads"
        empty="No leads yet."
        items={leads}
        render={(lead) => (
          <RowLink key={lead.id} href={`/app/leads/${lead.id}`}>
            <span className="font-medium">{lead.name}</span>
            <StatusBadge status={lead.status} />
            <span className="ml-auto tabular-nums text-muted">{formatMoney(lead.estimatedValue)}</span>
          </RowLink>
        )}
      />

      <Section
        icon={<FileText className="size-4" />}
        title="Quotes"
        empty="No quotes yet."
        items={quotes}
        render={(quote) => (
          <RowLink key={quote.id} href={`/app/quotes/${quote.id}`}>
            <span className="font-medium">{quote.quoteNumber}</span>
            <StatusBadge status={quote.status} />
            <span className="ml-auto tabular-nums text-muted">{formatMoney(quote.amount)}</span>
          </RowLink>
        )}
      />

      <Section
        icon={<Receipt className="size-4" />}
        title="Invoices"
        empty="No invoices yet."
        items={invoices}
        render={(inv) => (
          <RowLink key={inv.id} href={`/app/invoices/${inv.id}`}>
            <span className="font-medium">{inv.invoiceNumber}</span>
            <StatusBadge status={inv.status} />
            <span className="ml-auto tabular-nums text-muted">{formatMoney(inv.balance)} owing</span>
          </RowLink>
        )}
      />

      <Section
        icon={<Briefcase className="size-4" />}
        title="Jobs"
        empty="No jobs yet."
        items={jobs}
        render={(job) => (
          <RowLink key={job.id} href={`/app/jobs/${job.id}`}>
            <span className="font-medium">{job.title}</span>
            <StatusBadge status={job.status} />
            <span className="ml-auto tabular-nums text-muted">{formatMoney(job.actualRevenue)}</span>
          </RowLink>
        )}
      />

      <Section
        icon={<Bot className="size-4" />}
        title="AI activity"
        empty="No AI actions for this customer yet."
        items={aiActions}
        render={(a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="font-medium">{a.title}</span>
            <PriorityBadge priority={a.priority} />
            <StatusBadge status={a.status} />
            <span className="ml-auto tabular-nums text-muted">{formatMoney(a.estimatedValue)}</span>
          </div>
        )}
      />
    </div>
  );
}

function Section<T extends { id: string }>({
  icon,
  title,
  items,
  empty,
  render,
}: {
  icon: React.ReactNode;
  title: string;
  items: T[];
  empty: string;
  render: (item: T) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        {icon}
        <p className="text-sm font-semibold text-foreground">
          {title} <span className="font-normal text-muted">({items.length})</span>
        </p>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">{empty}</p>
      ) : (
        <div className="divide-y divide-border">{items.map(render)}</div>
      )}
    </div>
  );
}

function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-2/60">
      {children}
    </Link>
  );
}
