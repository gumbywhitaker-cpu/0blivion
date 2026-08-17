import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "danger" | "warning" | "info" | "success";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  brand: "bg-brand-light text-brand-dark",
  danger: "bg-danger-light text-danger",
  warning: "bg-warning-light text-warning",
  info: "bg-info-light text-info",
  success: "bg-success-light text-brand-dark",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  // leads
  NEW: "info",
  CONTACTED: "warning",
  QUALIFIED: "info",
  QUOTED: "brand",
  WON: "success",
  LOST: "neutral",
  DORMANT: "neutral",
  // quotes
  DRAFT: "neutral",
  SENT: "info",
  VIEWED: "warning",
  FOLLOW_UP: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  EXPIRED: "neutral",
  // invoices
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "danger",
  BAD_DEBT: "danger",
  // jobs
  LEAD: "info",
  BOOKED: "brand",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  INVOICED: "brand",
  CANCELLED: "neutral",
  // customers
  ACTIVE: "success",
  AT_RISK: "warning",
  VIP: "brand",
  ARCHIVED: "neutral",
  // ai actions
  PENDING: "warning",
  APPROVED: "info",
  DISMISSED: "neutral",
  FAILED: "danger",
  // subscriptions
  TRIALING: "info",
  PAST_DUE: "warning",
  CANCELED: "danger",
  INCOMPLETE: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  FOLLOW_UP: "Follow up",
  PARTIALLY_PAID: "Partially paid",
  BAD_DEBT: "Bad debt",
  IN_PROGRESS: "In progress",
  AT_RISK: "At risk",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const label = STATUS_LABEL[status] ?? toTitle(status);
  return <Badge tone={tone}>{label}</Badge>;
}

const PRIORITY_TONE: Record<string, Tone> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge tone={PRIORITY_TONE[priority] ?? "neutral"}>{toTitle(priority)}</Badge>;
}

function toTitle(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
