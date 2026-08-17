"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { CustomerPicker, type CustomerOption } from "@/components/app/CustomerPicker";
import { useToast } from "@/components/ui/Toast";

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export function InvoiceFormModal({
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
    amount: "",
    dueDate: defaultDueDate(),
    notes: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          amount: Number(form.amount),
          dueDate: new Date(form.dueDate).toISOString(),
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      push("Invoice created.", "success");
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create invoice" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Customer" htmlFor="i-customer">
          <CustomerPicker
            id="i-customer"
            customers={customers}
            value={form.customerId}
            onChange={(id) => setForm({ ...form, customerId: id })}
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount ($)" htmlFor="i-amount">
            <Input
              id="i-amount"
              type="number"
              min={0}
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </FormField>
          <FormField label="Due date" htmlFor="i-due">
            <Input
              id="i-due"
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </FormField>
        </div>
        <FormField label="Notes" htmlFor="i-notes">
          <Textarea id="i-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
