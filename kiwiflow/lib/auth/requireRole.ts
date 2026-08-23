import type { OrgType, UserRole } from "@/lib/types";

const MANAGE_ROLES: UserRole[] = ["OWNER", "MANAGER"];

export function canManage(role: UserRole): boolean {
  return MANAGE_ROLES.includes(role);
}

/** Throws for mutation endpoints/actions that require OWNER or MANAGER. */
export function assertCanManage(role: UserRole): void {
  if (!canManage(role)) {
    throw new Error("Forbidden: this action requires an OWNER or MANAGER role");
  }
}

/**
 * ADMIN is a platform-wide, cross-organization role with no tenant isolation —
 * every other check in this codebase scopes queries to session.organizationId,
 * this is the one deliberate exception. Never reachable via signup (see
 * SELF_SERVE_ORG_TYPES in lib/types.ts); only created by scripts/create-admin.ts.
 */
export function isAdmin(orgType: OrgType): boolean {
  return orgType === "ADMIN";
}

export function assertIsAdmin(orgType: OrgType): void {
  if (!isAdmin(orgType)) {
    throw new Error("Forbidden: this page requires the platform ADMIN role");
  }
}
