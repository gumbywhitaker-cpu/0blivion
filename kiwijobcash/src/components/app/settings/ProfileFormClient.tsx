"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { FormField, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type ProfileData = {
  name: string;
  businessType: string;
  industry: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  employeeCount: string;
  averageJobValue?: number;
};

export function ProfileFormClient({ business }: { business: ProfileData }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = React.useState(business);
  const [saving, setSaving] = React.useState(false);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          averageJobValue: form.averageJobValue ? Number(form.averageJobValue) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Couldn't save changes.", "error");
        return;
      }
      toast.push("Business profile updated.", "success");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader
          title="Business profile"
          subtitle="This appears on quotes, invoices, and AI-drafted messages."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Business name" htmlFor="name">
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </FormField>
          <FormField label="Industry" htmlFor="industry">
            <Input
              id="industry"
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="e.g. Plumbing"
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </FormField>
          <FormField label="Website" htmlFor="website">
            <Input id="website" value={form.website} onChange={(e) => update("website", e.target.value)} />
          </FormField>
          <FormField label="Employee count" htmlFor="employeeCount">
            <Input
              id="employeeCount"
              value={form.employeeCount}
              onChange={(e) => update("employeeCount", e.target.value)}
              placeholder="e.g. 3"
            />
          </FormField>
          <FormField label="Address" htmlFor="address">
            <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </FormField>
          <FormField label="City" htmlFor="city">
            <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
          </FormField>
          <FormField label="Average job value ($NZD)" htmlFor="averageJobValue">
            <Input
              id="averageJobValue"
              type="number"
              min={0}
              value={form.averageJobValue ?? ""}
              onChange={(e) => update("averageJobValue", e.target.value ? Number(e.target.value) : undefined)}
            />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </Card>
    </form>
  );
}
