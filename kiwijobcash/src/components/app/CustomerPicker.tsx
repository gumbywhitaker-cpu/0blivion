"use client";

import * as React from "react";
import { Select } from "@/components/ui/Field";

export type CustomerOption = { id: string; name: string; companyName: string | null };

export function CustomerPicker({
  customers,
  value,
  onChange,
  id,
  required,
}: {
  customers: CustomerOption[];
  value: string;
  onChange: (id: string) => void;
  id?: string;
  required?: boolean;
}) {
  return (
    <Select id={id} required={required} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select a customer…</option>
      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
          {c.companyName ? ` — ${c.companyName}` : ""}
        </option>
      ))}
    </Select>
  );
}
