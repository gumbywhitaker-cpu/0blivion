import type { UserRole } from "@/lib/types";

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
