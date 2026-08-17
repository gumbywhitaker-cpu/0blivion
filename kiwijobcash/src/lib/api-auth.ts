import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSessionFromCookies } from "@/lib/auth";
import { hasPermission, type Permission, type Role } from "@/lib/permissions";
import type { Business, BusinessMember, User } from "@/generated/prisma/client";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ApiContext = {
  user: Pick<User, "id" | "name" | "email" | "isSuperAdmin">;
  business: Business;
  membership: BusinessMember;
};

/**
 * Resolves the authenticated user + their active business for an API route.
 * Every tenant-scoped query MUST filter by `business.id` returned here — never
 * trust a business_id supplied in the request body or query string.
 */
export async function requireApiBusiness(
  permission?: Permission
): Promise<ApiContext> {
  const session = await readSessionFromCookies();
  if (!session) throw new ApiError(401, "Not authenticated.");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, isSuperAdmin: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") {
    throw new ApiError(401, "Not authenticated.");
  }

  const memberships = await prisma.businessMember.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) {
    throw new ApiError(403, "No business found for this account.");
  }

  const preferred =
    (session.businessId &&
      memberships.find((m) => m.businessId === session.businessId)) ||
    memberships[0];

  if (permission && !hasPermission(preferred.role as Role, permission)) {
    throw new ApiError(403, "You don't have permission to do that.");
  }

  const { business, ...membership } = preferred;
  return { user, business, membership };
}

export async function requireApiSuperAdmin() {
  const session = await readSessionFromCookies();
  if (!session) throw new ApiError(401, "Not authenticated.");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isSuperAdmin) throw new ApiError(403, "Admin access required.");
  return user;
}

export function apiErrorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("Unhandled API error:", err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
