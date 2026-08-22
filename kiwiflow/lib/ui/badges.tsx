import type {
  JobStatus,
  JobPriority,
  InvoiceStatus,
  NotificationUrgency,
  MaterialOrderStatus,
  BiosecurityRiskLevel,
  SafetySeverityLevel,
  CertificationStatus,
} from "@/lib/types";

const JOB_STATUS_STYLE: Record<JobStatus, string> = {
  NEW: "bg-zinc-100 text-zinc-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-kf-gold/20 text-kf-gold",
  COMPLETE: "bg-kf-green-100 text-kf-green-700",
  INVOICED: "bg-kf-green-700 text-white",
  CANCELLED: "bg-zinc-200 text-zinc-500 line-through",
};

export function JobStatusBadge({ status }: { status: string }) {
  const style = JOB_STATUS_STYLE[status as JobStatus] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status.replace("_", " ")}
    </span>
  );
}

const PRIORITY_STYLE: Record<JobPriority, string> = {
  LOW: "bg-zinc-100 text-zinc-600",
  NORMAL: "bg-zinc-100 text-zinc-700",
  HIGH: "bg-kf-gold/20 text-kf-gold",
  URGENT: "bg-kf-red/10 text-kf-red",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_STYLE[priority as JobPriority] ?? PRIORITY_STYLE.NORMAL;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {priority}
    </span>
  );
}

const INVOICE_STATUS_STYLE: Record<InvoiceStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-kf-green-100 text-kf-green-700",
  OVERDUE: "bg-kf-red/10 text-kf-red",
  VOID: "bg-zinc-200 text-zinc-500 line-through",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const style = INVOICE_STATUS_STYLE[status as InvoiceStatus] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}

const URGENCY_STYLE: Record<NotificationUrgency, string> = {
  NORMAL: "bg-zinc-100 text-zinc-700",
  URGENT: "bg-kf-gold/20 text-kf-gold",
  CRITICAL: "bg-kf-red/10 text-kf-red",
};

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const style = URGENCY_STYLE[urgency as NotificationUrgency] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {urgency}
    </span>
  );
}

const MATERIAL_ORDER_STATUS_STYLE: Record<MaterialOrderStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-kf-gold/20 text-kf-gold",
  DELIVERED: "bg-kf-green-100 text-kf-green-700",
  CANCELLED: "bg-zinc-200 text-zinc-500 line-through",
};

export function MaterialOrderStatusBadge({ status }: { status: string }) {
  const style = MATERIAL_ORDER_STATUS_STYLE[status as MaterialOrderStatus] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}

const BIOSECURITY_RISK_STYLE: Record<BiosecurityRiskLevel, string> = {
  LOW: "bg-kf-green-100 text-kf-green-700",
  MEDIUM: "bg-kf-gold/20 text-kf-gold",
  HIGH: "bg-kf-red/10 text-kf-red",
};

export function BiosecurityRiskBadge({ riskLevel }: { riskLevel: string }) {
  const style = BIOSECURITY_RISK_STYLE[riskLevel as BiosecurityRiskLevel] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {riskLevel}
    </span>
  );
}

const SAFETY_SEVERITY_STYLE: Record<SafetySeverityLevel, string> = {
  LOW: "bg-kf-green-100 text-kf-green-700",
  MEDIUM: "bg-kf-gold/20 text-kf-gold",
  HIGH: "bg-kf-red/10 text-kf-red",
  CRITICAL: "bg-kf-red text-white",
};

export function SafetySeverityBadge({ severity }: { severity: string }) {
  const style = SAFETY_SEVERITY_STYLE[severity as SafetySeverityLevel] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {severity}
    </span>
  );
}

const CERTIFICATION_STATUS_STYLE: Record<CertificationStatus, string> = {
  NOT_STARTED: "bg-zinc-100 text-zinc-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  CERTIFIED: "bg-kf-green-100 text-kf-green-700",
  EXPIRED: "bg-kf-red/10 text-kf-red",
  SUSPENDED: "bg-kf-red text-white",
};

export function CertificationStatusBadge({ status }: { status: string }) {
  const style = CERTIFICATION_STATUS_STYLE[status as CertificationStatus] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status.replace("_", " ")}
    </span>
  );
}
