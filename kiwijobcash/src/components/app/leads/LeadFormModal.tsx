"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea, Select } from "@/components/ui/Field";
import { CustomerPicker, type CustomerOption } from "@/components/app/CustomerPicker";
import { useToast } from "@/components/ui/Toast";

const SOURCES = ["Website", "Referral", "Google", "Facebook", "Phone", "Repeat customer", "Other"];

export function LeadFormModal({
  open,
  onClose,
  customers,
}: {
  open: boolean;
  onClose: () => void;
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    description: "",
    estimatedValue: "",
    priority: "MEDIUM",
    customerId: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
          customerId: form.customerId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      push("Lead added.", "success");
      onClose();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add lead" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Name" htmlFor="l-name">
          <Input
            id="l-name"
            required
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <FormField label="Link to existing customer (optional)" htmlFor="l-customer">
          <CustomerPicker
            id="l-customer"
            customers={customers}
            value={form.customerId}
            onChange={(id) => setForm({ ...form, customerId: id })}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Email" htmlFor="l-email">
            <Input id="l-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Phone" htmlFor="l-phone">
            <Input id="l-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Source" htmlFor="l-source">
            <Select id="l-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="">Select…</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Estimated value ($)" htmlFor="l-value">
            <Input
              id="l-value"
              type="number"
              min={0}
              value={form.estimatedValue}
              onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
            />
          </FormField>
        </div>
        <FormField label="What do they need?" htmlFor="l-description">
          <Textarea
            id="l-description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
