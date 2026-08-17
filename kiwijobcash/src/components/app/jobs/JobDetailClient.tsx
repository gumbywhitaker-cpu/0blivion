"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/format";
import { Receipt } from "lucide-react";

type Job = {
  id: string;
  jobNumber: string;
  title: string;
  jobType: string | null;
  description: string | null;
  status: string;
  quotedAmount: number | null;
  actualRevenue: number | null;
  labourCost: number;
  materialCost: number;
  otherCost: number;
  grossProfit: number | null;
  grossMargin: number | null;
  customer: { id: string; name: string };
  invoices: { id: string }[];
};

const STATUSES = ["LEAD", "QUOTED", "BOOKED", "IN_PROGRESS", "COMPLETED", "INVOICED", "PAID", "CANCELLED"];

export function JobDetailClient({ job }: { job: Job }) {
  const router = useRouter();
  const { push } = useToast();
  const [status, setStatus] = React.useState(job.status);
  const [costs, setCosts] = React.useState({
    actualRevenue: String(job.actualRevenue ?? job.quotedAmount ?? ""),
    labourCost: String(job.labourCost),
    materialCost: String(job.materialCost),
    otherCost: String(job.otherCost),
  });
  const [saving, setSaving] = React.useState(false);

  async function save(extra: Record<string, unknown> = {}) {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualRevenue: Number(costs.actualRevenue) || 0,
          labourCost: Number(costs.labourCost) || 0,
          materialCost: Number(costs.materialCost) || 0,
          otherCost: Number(costs.otherCost) || 0,
          ...extra,
        }),
      });
      if (!res.ok) throw new Error();
      push("Job updated.", "success");
      router.refresh();
    } catch {
      push("Couldn't update the job.", "error");
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
              <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {job.jobNumber} for{" "}
              <Link href={`/app/customers/${job.customer.id}`} className="text-brand hover:underline">
                {job.customer.name}
              </Link>
            </p>
          </div>
          {job.grossProfit !== null && (
            <div className="text-right">
              <p className="text-xs font-medium uppercase text-muted">Gross profit</p>
              <p className="text-2xl font-semibold tabular-nums text-money">{formatMoney(job.grossProfit)}</p>
              <p className="text-xs text-muted">{job.grossMargin !== null ? `${Math.round(job.grossMargin)}% margin` : ""}</p>
            </div>
          )}
        </div>

        <FormField label="Status" htmlFor="j-status" hint="Marking Completed locks in revenue and cost for Profit Radar.">
          <Select
            id="j-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              save({ status: e.target.value });
            }}
            disabled={saving}
            className="mt-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>
      </Card>

      <Card>
        <CardHeader title="Revenue & costs" subtitle="Used to calculate gross profit once the job is completed." />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Actual revenue ($)" htmlFor="rev">
            <Input
              id="rev"
              type="number"
              value={costs.actualRevenue}
              onChange={(e) => setCosts({ ...costs, actualRevenue: e.target.value })}
            />
          </FormField>
          <FormField label="Labour cost ($)" htmlFor="labour">
            <Input
              id="labour"
              type="number"
              value={costs.labourCost}
              onChange={(e) => setCosts({ ...costs, labourCost: e.target.value })}
            />
          </FormField>
          <FormField label="Material cost ($)" htmlFor="material">
            <Input
              id="material"
              type="number"
              value={costs.materialCost}
              onChange={(e) => setCosts({ ...costs, materialCost: e.target.value })}
            />
          </FormField>
          <FormField label="Other cost ($)" htmlFor="other">
            <Input
              id="other"
              type="number"
              value={costs.otherCost}
              onChange={(e) => setCosts({ ...costs, otherCost: e.target.value })}
            />
          </FormField>
        </div>
        <Button className="mt-4" size="sm" onClick={() => save()} loading={saving}>
          Save costs
        </Button>
      </Card>

      {job.invoices.length === 0 && (status === "COMPLETED" || status === "INVOICED") && (
        <Button
          href={`/app/invoices?new=1&customerId=${job.customer.id}`}
          variant="outline"
          icon={<Receipt className="size-4" />}
        >
          Create invoice for this job
        </Button>
      )}
    </div>
  );
}
