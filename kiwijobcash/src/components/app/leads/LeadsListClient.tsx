"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle, Users } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { formatMoney, formatDate } from "@/lib/format";
import { LeadFormModal } from "@/components/app/leads/LeadFormModal";
import type { CustomerOption } from "@/components/app/CustomerPicker";

export type LeadRow = {
  id: string;
  name: string;
  status: string;
  priority: string;
  estimatedValue: number | null;
  source: string | null;
  createdAt: string;
};

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST", "DORMANT"];

export function LeadsListClient({
  leads,
  customers,
}: {
  leads: LeadRow[];
  customers: CustomerOption[];
}) {
  const params = useSearchParams();
  const [modalOpen, setModalOpen] = React.useState(params.get("new") === "1");
  const [statusFilter, setStatusFilter] = React.useState("");

  const filtered = statusFilter ? leads.filter((l) => l.status === statusFilter) : leads;

  const columns: Column<LeadRow>[] = [
    { header: "Name", accessor: (l) => <span className="font-medium">{l.name}</span> },
    { header: "Status", accessor: (l) => <StatusBadge status={l.status} /> },
    { header: "Priority", accessor: (l) => <PriorityBadge priority={l.priority} />, hideOnMobile: true },
    { header: "Source", accessor: (l) => <span className="text-muted">{l.source ?? "—"}</span>, hideOnMobile: true },
    {
      header: "Value",
      accessor: (l) => <span className="tabular-nums font-medium">{formatMoney(l.estimatedValue)}</span>,
    },
    { header: "Added", accessor: (l) => <span className="text-muted">{formatDate(l.createdAt)}</span>, hideOnMobile: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
          Add lead
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title={leads.length === 0 ? "No leads yet" : "No matches"}
          description={
            leads.length === 0
              ? "Add your first lead to start tracking new enquiries."
              : "Try a different filter."
          }
          action={
            leads.length === 0 ? (
              <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
                Add lead
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} rows={filtered} getHref={(l) => `/app/leads/${l.id}`} />
      )}

      <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} customers={customers} />
    </div>
  );
}
