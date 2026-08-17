export type Role = "OWNER" | "ADMIN" | "MANAGER" | "STAFF" | "READ_ONLY";

const ROLE_RANK: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  STAFF: 1,
  READ_ONLY: 0,
};

export type Permission =
  | "records:view"
  | "records:create"
  | "records:edit"
  | "records:delete"
  | "ai:approve_send"
  | "team:manage"
  | "billing:manage"
  | "automation:manage"
  | "integrations:manage"
  | "business:delete";

const PERMISSION_MIN_ROLE: Record<Permission, Role> = {
  "records:view": "READ_ONLY",
  "records:create": "STAFF",
  "records:edit": "STAFF",
  "records:delete": "MANAGER",
  "ai:approve_send": "STAFF",
  "team:manage": "ADMIN",
  "billing:manage": "ADMIN",
  "automation:manage": "ADMIN",
  "integrations:manage": "ADMIN",
  "business:delete": "OWNER",
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSION_MIN_ROLE[permission]];
}

export function roleAtLeast(role: Role, minRole: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export const ALL_ROLES: Role[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "STAFF",
  "READ_ONLY",
];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
  READ_ONLY: "Read only",
};
