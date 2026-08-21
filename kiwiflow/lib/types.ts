// Central source of truth for the string-union "enums" described in
// prisma/schema.prisma. Keeping these here (not just as Prisma comments) means the
// Conductor, forms, and validators all share one definition instead of drifting.

export const ORG_TYPES = [
  "GROWER",
  "CONTRACTOR",
  "TRANSPORT",
  "PACKHOUSE",
  "ACCOUNTANT",
  "ADMIN",
] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export const USER_ROLES = ["OWNER", "MANAGER", "FIELD", "DRIVER", "VIEWER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const JOB_STATUSES = [
  "NEW",
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETE",
  "INVOICED",
  "CANCELLED",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

// Allowed forward transitions. The Conductor and job actions both consult this so
// "COMPLETE -> SCHEDULED" isn't reachable from either a bug or a crafted request.
export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  NEW: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETE", "CANCELLED"],
  COMPLETE: ["INVOICED"],
  INVOICED: [],
  CANCELLED: [],
};

export const JOB_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type JobPriority = (typeof JOB_PRIORITIES)[number];

export const JOB_TYPES = ["HARVEST", "SPRAY", "PRUNING", "TRANSPORT", "GENERAL"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const NOTIFICATION_URGENCIES = ["NORMAL", "URGENT", "CRITICAL"] as const;
export type NotificationUrgency = (typeof NOTIFICATION_URGENCIES)[number];

export const CONTRACTOR_LINK_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type ContractorLinkStatus = (typeof CONTRACTOR_LINK_STATUSES)[number];

export const ONBOARDING_STATUSES = ["PENDING", "USED", "EXPIRED"] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export type SessionUser = {
  userId: string;
  organizationId: string;
  orgType: OrgType;
  role: UserRole;
  name: string;
  email: string;
};
