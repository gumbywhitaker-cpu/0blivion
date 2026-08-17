"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const CATEGORIES = ["Materials", "Fuel", "Vehicle", "Tools", "Subcontractor", "Insurance", "Admin", "Other"];

export function ExpenseFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ category: "Materials", description: "", amount: "", supplier: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          description: form.description || undefined,
          amount: Number(form.amount),
          supplier: form.supplier || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      push("Expense added.", "success");
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add expense" size="sm">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Category" htmlFor="e-category">
          <Select id="e-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Amount ($)" htmlFor="e-amount">
          <Input
            id="e-amount"
            type="number"
            min={0}
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </FormField>
        <FormField label="Description" htmlFor="e-desc">
          <Input id="e-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormField>
        <FormField label="Supplier (optional)" htmlFor="e-supplier">
          <Input id="e-supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
