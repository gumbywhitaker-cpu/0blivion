"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { CustomerPicker, type CustomerOption } from "@/components/app/CustomerPicker";
import { useToast } from "@/components/ui/Toast";

export function JobFormModal({
  open,
  onClose,
  customers,
}: {
  open: boolean;
  onClose: () => void;
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    customerId: params.get("customerId") ?? "",
    title: "",
    jobType: "",
    quotedAmount: "",
    scheduledDate: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          title: form.title,
          jobType: form.jobType || undefined,
          quoteId: params.get("quoteId") ?? undefined,
          quotedAmount: form.quotedAmount ? Number(form.quotedAmount) : undefined,
          scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      push("Job created.", "success");
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add job" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Customer" htmlFor="j-customer">
          <CustomerPicker
            id="j-customer"
            customers={customers}
            value={form.customerId}
            onChange={(id) => setForm({ ...form, customerId: id })}
            required
          />
        </FormField>
        <FormField label="Job title" htmlFor="j-title">
          <Input
            id="j-title"
            required
            placeholder="e.g. Bathroom leak repair"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Job type" htmlFor="j-type">
            <Input
              id="j-type"
              placeholder="Repair, Install…"
              value={form.jobType}
              onChange={(e) => setForm({ ...form, jobType: e.target.value })}
            />
          </FormField>
          <FormField label="Quoted amount ($)" htmlFor="j-amount">
            <Input
              id="j-amount"
              type="number"
              min={0}
              value={form.quotedAmount}
              onChange={(e) => setForm({ ...form, quotedAmount: e.target.value })}
            />
          </FormField>
        </div>
        <FormField label="Scheduled date" htmlFor="j-date">
          <Input
            id="j-date"
            type="date"
            value={form.scheduledDate}
            onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
          />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add job
          </Button>
        </div>
      </form>
    </Modal>
  );
}
