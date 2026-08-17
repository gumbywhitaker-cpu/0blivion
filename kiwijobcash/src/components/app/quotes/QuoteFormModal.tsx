"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { CustomerPicker, type CustomerOption } from "@/components/app/CustomerPicker";
import { useToast } from "@/components/ui/Toast";

export function QuoteFormModal({
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
    description: "",
    amount: "",
    expiryDate: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          description: form.description || undefined,
          amount: Number(form.amount),
          leadId: params.get("leadId") ?? undefined,
          expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      push("Quote created.", "success");
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create quote" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Customer" htmlFor="q-customer">
          <CustomerPicker
            id="q-customer"
            customers={customers}
            value={form.customerId}
            onChange={(id) => setForm({ ...form, customerId: id })}
            required
          />
        </FormField>
        <FormField label="Amount ($)" htmlFor="q-amount">
          <Input
            id="q-amount"
            type="number"
            min={0}
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </FormField>
        <FormField label="Description" htmlFor="q-description">
          <Textarea
            id="q-description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
        <FormField label="Expiry date (optional)" htmlFor="q-expiry">
          <Input
            id="q-expiry"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create quote
          </Button>
        </div>
      </form>
    </Modal>
  );
}
