import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSessionFromCookies } from "@/lib/auth";
import type { Business, BusinessMember, User } from "@/generated/prisma/client";

export type AuthedUser = Pick<
  User,
  "id" | "name" | "email" | "avatarUrl" | "isSuperAdmin" | "status"
>;

export type ActiveBusinessContext = {
  user: AuthedUser;
  business: Business;
  membership: BusinessMember;
};

/** Reads the session cookie and loads the user. Returns null if unauthenticated. */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const session = await readSessionFromCookies();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      isSuperAdmin: true,
      status: true,
    },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

/** Loads the user's active business context (first ACTIVE membership, preferring session hint). */
export async function getActiveBusinessContext(): Promise<ActiveBusinessContext | null> {
  const session = await readSessionFromCookies();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      isSuperAdmin: true,
      status: true,
    },
  });
  if (!user || user.status !== "ACTIVE") return null;

  const memberships = await prisma.businessMember.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;

  const preferred =
    (session.businessId &&
      memberships.find((m) => m.businessId === session.businessId)) ||
    memberships[0];

  const { business, ...membership } = preferred;
  return { user, business, membership };
}

/** Use in Server Components/pages that require a logged-in user. Redirects to /login otherwise. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Use in /app pages. Redirects unauthenticated users to /login and users with no business to /onboarding. */
export async function requireBusiness(): Promise<ActiveBusinessContext> {
  const ctx = await getActiveBusinessContext();
  if (!ctx) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    redirect("/onboarding");
  }
  return ctx;
}

/** Use in /admin pages. Redirects non-super-admins. */
export async function requireSuperAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (!user.isSuperAdmin) redirect("/app");
  return user;
}
