"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function CustomerFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      push("Customer added.", "success");
      setForm({ name: "", companyName: "", email: "", phone: "", address: "", city: "", notes: "" });
      onClose();
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add customer" size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Name" htmlFor="c-name">
          <Input
            id="c-name"
            required
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Company (optional)" htmlFor="c-company">
            <Input
              id="c-company"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </FormField>
          <FormField label="City" htmlFor="c-city">
            <Input id="c-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Email" htmlFor="c-email">
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Phone" htmlFor="c-phone">
            <Input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Address" htmlFor="c-address">
          <Input id="c-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </FormField>
        <FormField label="Notes" htmlFor="c-notes">
          <Textarea
            id="c-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add customer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
