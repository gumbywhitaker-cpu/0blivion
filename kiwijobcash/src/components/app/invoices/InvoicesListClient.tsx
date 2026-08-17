"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle, Receipt } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatMoney, formatDate } from "@/lib/format";
import { InvoiceFormModal } from "@/components/app/invoices/InvoiceFormModal";
import type { CustomerOption } from "@/components/app/CustomerPicker";

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  balance: number;
  dueDate: string;
  customerName: string;
};

export function InvoicesListClient({
  invoices,
  customers,
}: {
  invoices: InvoiceRow[];
  customers: CustomerOption[];
}) {
  const params = useSearchParams();
  const [modalOpen, setModalOpen] = React.useState(params.get("new") === "1");

  const columns: Column<InvoiceRow>[] = [
    { header: "Invoice", accessor: (i) => <span className="font-medium">{i.invoiceNumber}</span> },
    { header: "Customer", accessor: (i) => i.customerName },
    { header: "Status", accessor: (i) => <StatusBadge status={i.status} /> },
    { header: "Due", accessor: (i) => <span className="text-muted">{formatDate(i.dueDate)}</span>, hideOnMobile: true },
    {
      header: "Balance",
      accessor: (i) => <span className="tabular-nums font-medium">{formatMoney(i.balance)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
          Create invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-6" />}
          title="No invoices yet"
          description="Create your first invoice to start tracking payments and overdue reminders."
          action={
            <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
              Create invoice
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={invoices} getHref={(i) => `/app/invoices/${i.id}`} />
      )}

      <InvoiceFormModal open={modalOpen} onClose={() => setModalOpen(false)} customers={customers} />
    </div>
  );
}
