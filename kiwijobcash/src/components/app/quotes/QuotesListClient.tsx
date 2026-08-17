"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle, FileText } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatMoney, formatDate } from "@/lib/format";
import { QuoteFormModal } from "@/components/app/quotes/QuoteFormModal";
import type { CustomerOption } from "@/components/app/CustomerPicker";

export type QuoteRow = {
  id: string;
  quoteNumber: string;
  status: string;
  amount: number;
  issueDate: string;
  customerName: string;
  heat: "HOT" | "WARM" | "COLD" | null;
};

const HEAT_TONE = { HOT: "danger", WARM: "warning", COLD: "neutral" } as const;

export function QuotesListClient({ quotes, customers }: { quotes: QuoteRow[]; customers: CustomerOption[] }) {
  const params = useSearchParams();
  const [modalOpen, setModalOpen] = React.useState(params.get("new") === "1");

  const columns: Column<QuoteRow>[] = [
    { header: "Quote", accessor: (q) => <span className="font-medium">{q.quoteNumber}</span> },
    { header: "Customer", accessor: (q) => q.customerName },
    { header: "Status", accessor: (q) => <StatusBadge status={q.status} /> },
    {
      header: "Heat",
      accessor: (q) => (q.heat ? <Badge tone={HEAT_TONE[q.heat]}>{q.heat}</Badge> : "—"),
      hideOnMobile: true,
    },
    { header: "Amount", accessor: (q) => <span className="tabular-nums font-medium">{formatMoney(q.amount)}</span> },
    { header: "Issued", accessor: (q) => <span className="text-muted">{formatDate(q.issueDate)}</span>, hideOnMobile: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
          Create quote
        </Button>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="No quotes yet"
          description="Create your first quote to start tracking follow-ups and conversions."
          action={
            <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
              Create quote
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={quotes} getHref={(q) => `/app/quotes/${q.id}`} />
      )}

      <QuoteFormModal open={modalOpen} onClose={() => setModalOpen(false)} customers={customers} />
    </div>
  );
}
