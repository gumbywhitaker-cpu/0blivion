"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Select, FormField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { ActionCard, type ActionCardData } from "@/components/app/ActionCard";
import { FileText, Phone, Mail } from "lucide-react";

type LeadDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  description: string | null;
  estimatedValue: number | null;
  status: string;
  priority: string;
  createdAt: Date;
  lastContactedAt: Date | null;
  nextFollowupAt: Date | null;
  customer: { id: string; name: string } | null;
  quoteCount: number;
};

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST", "DORMANT"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export function LeadDetailClient({
  lead,
  relatedAction,
}: {
  lead: LeadDetail;
  relatedAction: ActionCardData | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [status, setStatus] = React.useState(lead.status);
  const [priority, setPriority] = React.useState(lead.priority);
  const [saving, setSaving] = React.useState(false);

  async function patch(fields: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error();
      push("Lead updated.", "success");
      router.refresh();
    } catch {
      push("Couldn't update the lead.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function markContacted() {
    await patch({ markContacted: true, status: status === "NEW" ? "CONTACTED" : undefined });
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{lead.name}</h1>
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
            </div>
            {lead.customer && (
              <p className="mt-1 text-sm text-muted">
                Linked to{" "}
                <Link href={`/app/customers/${lead.customer.id}`} className="text-brand hover:underline">
                  {lead.customer.name}
                </Link>
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {lead.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {lead.email}
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {lead.phone}
                </span>
              )}
              {lead.source && <span>via {lead.source}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase text-muted">Estimated value</p>
            <p className="text-2xl font-semibold tabular-nums text-money">
              {formatMoney(lead.estimatedValue)}
            </p>
          </div>
        </div>

        {lead.description && (
          <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-muted">{lead.description}</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted">Added</p>
            <p className="mt-0.5 font-medium">{formatDate(lead.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted">Last contacted</p>
            <p className="mt-0.5 font-medium">{formatDateTime(lead.lastContactedAt)}</p>
          </div>
          <div>
            <p className="text-muted">Next follow-up</p>
            <p className="mt-0.5 font-medium">{formatDate(lead.nextFollowupAt)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
          <Button onClick={markContacted} loading={saving} size="sm">
            Mark contacted
          </Button>
          <Button
            href={`/app/quotes?new=1&customerId=${lead.customer?.id ?? ""}&leadId=${lead.id}`}
            variant="outline"
            size="sm"
            icon={<FileText className="size-4" />}
          >
            Create quote
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Status" />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Pipeline status" htmlFor="status">
            <Select
              id="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                patch({ status: e.target.value });
              }}
              disabled={saving}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Priority" htmlFor="priority">
            <Select
              id="priority"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                patch({ priority: e.target.value });
              }}
              disabled={saving}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Card>

      {relatedAction && (
        <div>
          <CardHeader title="AI recommendation" />
          <ActionCard action={relatedAction} onChanged={() => router.refresh()} />
        </div>
      )}
    </div>
  );
}
