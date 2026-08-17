"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PlusCircle, Briefcase } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/format";
import { JobFormModal } from "@/components/app/jobs/JobFormModal";
import type { CustomerOption } from "@/components/app/CustomerPicker";

export type JobRow = {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  quotedAmount: number | null;
  actualRevenue: number | null;
  customerName: string;
};

export function JobsListClient({ jobs, customers }: { jobs: JobRow[]; customers: CustomerOption[] }) {
  const params = useSearchParams();
  const [modalOpen, setModalOpen] = React.useState(params.get("new") === "1");

  const columns: Column<JobRow>[] = [
    { header: "Job", accessor: (j) => <span className="font-medium">{j.title}</span> },
    { header: "Customer", accessor: (j) => j.customerName },
    { header: "Status", accessor: (j) => <StatusBadge status={j.status} /> },
    {
      header: "Value",
      accessor: (j) => (
        <span className="tabular-nums font-medium">{formatMoney(j.actualRevenue ?? j.quotedAmount)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
          Add job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="size-6" />}
          title="No jobs yet"
          description="Track scheduled and completed work here — job cost and margin feed straight into Profit Radar."
          action={
            <Button onClick={() => setModalOpen(true)} icon={<PlusCircle className="size-4" />}>
              Add job
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={jobs} getHref={(j) => `/app/jobs/${j.id}`} />
      )}

      <JobFormModal open={modalOpen} onClose={() => setModalOpen(false)} customers={customers} />
    </div>
  );
}
