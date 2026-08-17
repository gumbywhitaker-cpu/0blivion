"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle, Search, Users, Upload } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { formatMoney, formatDate } from "@/lib/format";
import { CustomerFormModal } from "@/components/app/customers/CustomerFormModal";

export type CustomerRow = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  customerStatus: string;
  lifetimeValue: number;
  lastJobDate: string | null;
};

export function CustomersListClient({ customers }: { customers: CustomerRow[] }) {
  const params = useSearchParams();
  const [modalOpen, setModalOpen] = React.useState(params.get("new") === "1");
  const [search, setSearch] = React.useState("");

  const filtered = customers.filter((c) =>
    `${c.name} ${c.companyName ?? ""} ${c.email ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<CustomerRow>[] = [
    {
      header: "Name",
      accessor: (c) => (
        <div>
          <p className="font-medium">{c.name}</p>
          {c.companyName && <p className="text-xs text-muted">{c.companyName}</p>}
        </div>
      ),
    },
    { header: "Status", accessor: (c) => <StatusBadge status={c.customerStatus} /> },
    {
      header: "Contact",
      accessor: (c) => <span className="text-muted">{c.email || c.phone || "—"}</span>,
      hideOnMobile: true,
    },
    {
      header: "Lifetime value",
      accessor: (c) => <span className="tabular-nums font-medium">{formatMoney(c.lifetimeValue)}</span>,
    },
    {
      header: "Last job",
      accessor: (c) => <span className="text-muted">{formatDate(c.lastJobDate)}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search customers…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button href="/app/customers/import" variant="outline" icon={<Upload className="size-4" />}>
            Import CSV
          </Button>
          <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
            Add customer
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title={customers.length === 0 ? "No customers yet" : "No matches"}
          description={
            customers.length === 0
              ? "Add your first customer, or import a spreadsheet from Integrations."
              : "Try a different search."
          }
          action={
            customers.length === 0 ? (
              <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
                Add customer
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} rows={filtered} getHref={(c) => `/app/customers/${c.id}`} />
      )}

      <CustomerFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
