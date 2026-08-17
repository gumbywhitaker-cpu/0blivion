"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Field";

const OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "value", label: "Highest value" },
  { value: "urgency", label: "Most urgent" },
  { value: "newest", label: "Newest" },
];

export function ActionCentreControls({ activeSort }: { activeSort: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-muted">
        Sort by
      </label>
      <Select
        id="sort"
        value={activeSort}
        onChange={(e) => router.push(`/app/actions?sort=${e.target.value}`)}
        className="w-auto"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
