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

// ADMIN is deliberately excluded: it's a platform-wide, cross-organization role
// with no tenant isolation (see lib/auth/requireRole.ts assertIsAdmin), and must
// never be reachable through self-service signup. The signup Server Action
// validates against this list, not the full ORG_TYPES — an ADMIN org can only be
// created by a script run directly against the database (scripts/create-admin.ts).
export const SELF_SERVE_ORG_TYPES = ["GROWER", "CONTRACTOR", "TRANSPORT", "PACKHOUSE", "ACCOUNTANT"] as const;

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

export const SUPPLIER_CATEGORIES = [
  "FERTILISER",
  "CHEMICAL",
  "PACKAGING",
  "FUEL",
  "EQUIPMENT",
  "OTHER",
] as const;
export type SupplierCategory = (typeof SUPPLIER_CATEGORIES)[number];

export const MATERIAL_ORDER_STATUSES = ["DRAFT", "SUBMITTED", "CONFIRMED", "DELIVERED", "CANCELLED"] as const;
export type MaterialOrderStatus = (typeof MATERIAL_ORDER_STATUSES)[number];

// Same shape as JOB_STATUS_TRANSITIONS: the Conductor and order actions both
// consult this so an invalid jump (e.g. DRAFT -> DELIVERED) isn't reachable.
export const MATERIAL_ORDER_STATUS_TRANSITIONS: Record<MaterialOrderStatus, MaterialOrderStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const KIWIFRUIT_VARIETIES = ["HAYWARD", "GOLD3", "OTHER"] as const;
export type KiwifruitVariety = (typeof KIWIFRUIT_VARIETIES)[number];

/**
 * Reference harvest-maturity minimums, sourced from NZKGI's published grower
 * handbook and industry summaries (see docs/BLUEPRINT.md Section 21 for citations).
 * Zespri sets and can revise the actual clearance thresholds each season via its own
 * Harvest Standard — KiwiFlow has no live feed to that document, so these are
 * defaults a grower can override per test, not an authority. Every
 * HarvestMaturityTest snapshots the threshold it was actually checked against.
 */
export const MATURITY_REFERENCE_THRESHOLDS: Record<KiwifruitVariety, { minDryMatterPercent: number; minBrix: number }> = {
  HAYWARD: { minDryMatterPercent: 15.5, minBrix: 6.2 },
  GOLD3: { minDryMatterPercent: 16.1, minBrix: 8.0 },
  OTHER: { minDryMatterPercent: 15, minBrix: 6.2 },
};

/**
 * Reference coolstore range for kiwifruit long-term storage (industry sources cite
 * roughly -1°C to +1°C, 90-95% RH). This is a general packhouse default, not a
 * per-variety or per-ripeness-stage spec — override per facility as needed.
 */
export const COOLSTORE_REFERENCE_RANGE_C = { min: -1, max: 1 };

export const EMPLOYMENT_TYPES = ["HOURLY", "PIECE_RATE", "SALARY", "MIXED"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const MINIMUM_WAGE_TYPES = ["ADULT", "STARTING_OUT_TRAINING", "RSE_RETURNING_WORKER"] as const;
export type MinimumWageType = (typeof MINIMUM_WAGE_TYPES)[number];

/**
 * Reference minimum wage rates, NZ$/hour, effective 1 April 2026 per MBIE's
 * published rate (see docs — sourced live, not invented). Same pattern as
 * MATURITY_REFERENCE_THRESHOLDS below: a snapshotted default an operator
 * must keep current each year, not a live government feed. KiwiFlow has no
 * integration with MBIE/Employment NZ — every WageTopUp record snapshots
 * the rate it was actually computed against, for audit purposes.
 *
 * RSE_RETURNING_WORKER is a *different* floor from the general Minimum Wage
 * Act one: Immigration NZ's RSE Instructions require an RSE worker in their
 * 3rd or later season to be paid at least the adult minimum wage plus 10%
 * (immigration.govt.nz, "Pay and sick leave entitlements for RSE workers").
 * This is an immigration/visa-compliance requirement on top of employment
 * law, not itself the Minimum Wage Act floor — still worth checking here
 * since a piece-rate returning RSE worker under-topped-up against the plain
 * adult rate would still be short of what their Agreement to Recruit
 * actually requires. Derived from ADULT so it tracks automatically if that
 * changes; confirm the 10% figure against the current RSE Instructions
 * before relying on it, the same as every other rate in this file.
 */
const ADULT_MINIMUM_WAGE = 23.95;
export const MINIMUM_WAGE_REFERENCE_RATES: Record<MinimumWageType, number> = {
  ADULT: ADULT_MINIMUM_WAGE,
  STARTING_OUT_TRAINING: 19.16,
  RSE_RETURNING_WORKER: Math.round(ADULT_MINIMUM_WAGE * 1.1 * 100) / 100,
};

export const BIOSECURITY_CATEGORIES = ["PSA", "BMSB", "OTHER_PEST", "OTHER_DISEASE", "GENERAL"] as const;
export type BiosecurityCategory = (typeof BIOSECURITY_CATEGORIES)[number];

export const BIOSECURITY_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type BiosecurityRiskLevel = (typeof BIOSECURITY_RISK_LEVELS)[number];

export const SAFETY_INCIDENT_TYPES = ["HAZARD", "NEAR_MISS", "INCIDENT"] as const;
export type SafetyIncidentType = (typeof SAFETY_INCIDENT_TYPES)[number];

/**
 * CRITICAL is for anything that could meet the Health and Safety at Work
 * Act 2015 definition of a "notifiable event" (death, serious injury,
 * serious illness) — KiwiFlow does not submit anything to WorkSafe itself,
 * there is no such integration. Flagging it here is a heads-up to the
 * operator that they likely have a separate legal notification obligation,
 * not a record that any notification happened.
 */
export const SAFETY_SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type SafetySeverityLevel = (typeof SAFETY_SEVERITY_LEVELS)[number];

export const CERTIFICATION_SCHEMES = ["NZGAP", "GLOBALGAP", "OTHER"] as const;
export type CertificationScheme = (typeof CERTIFICATION_SCHEMES)[number];

export const CERTIFICATION_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "CERTIFIED", "EXPIRED", "SUSPENDED"] as const;
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

/**
 * Default rolling-window size for the RSE/seasonal-labour hours check
 * (lib/payroll.ts). This is a configurable heads-up threshold, not a legal
 * figure this app asserts — see the CrewMember schema comment. 4 weeks is a
 * common RSE Agreement-to-Recruit averaging period, but operators must
 * confirm the actual period and minimum against their own ATR and current
 * MBIE/Immigration NZ policy.
 */
export const PAYROLL_COMPLIANCE_WINDOW_WEEKS = 4;

export type SessionUser = {
  userId: string;
  organizationId: string;
  orgType: OrgType;
  role: UserRole;
  name: string;
  email: string;
};
