"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { formatDateTime } from "@/lib/format";
import { Inbox } from "lucide-react";

type SupportRequest = {
  id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  businessName: string | null;
  userEmail: string | null;
  createdAt: string;
};

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function SupportListClient({ requests: initial }: { requests: SupportRequest[] }) {
  const [requests, setRequests] = React.useState(initial);

  async function updateStatus(id: string, status: string) {
    setRequests((r) => r.map((req) => (req.id === id ? { ...req, status } : req)));
    await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  if (requests.length === 0) {
    return <EmptyState icon={<Inbox className="size-6" />} title="No support requests" description="Nothing's come in yet." />;
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{r.subject}</p>
                {r.priority !== "NORMAL" && <Badge tone={r.priority === "URGENT" ? "danger" : "warning"}>{r.priority}</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">
                {r.businessName ?? r.userEmail ?? "Anonymous"} — {formatDateTime(r.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={r.status} />
              <Select
                value={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value)}
                className="h-9 w-40"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{r.message}</p>
        </Card>
      ))}
    </div>
  );
}
