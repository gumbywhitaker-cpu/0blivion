import "server-only";
import { prisma } from "@/lib/db";

/**
 * Fail-closed login lockout (docs/BLUEPRINT.md Section 24). Not IP-based: a
 * shared office/NAT shouldn't lock everyone out together, and this MVP has no
 * reliable client IP source without adding proxy-trust config. Locking on email
 * instead directly protects the thing that matters — a specific account being
 * brute-forced — at the cost of letting an attacker who knows a real email
 * temporarily deny that one user's own logins. That trade-off is the right one
 * for an app where account discovery already requires knowing someone's email.
 */
const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

export async function isLockedOut(email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const recentFailures = await prisma.loginAttempt.count({
    where: { email, succeeded: false, createdAt: { gte: since } },
  });
  return recentFailures >= MAX_FAILURES;
}

export async function recordLoginAttempt(email: string, succeeded: boolean): Promise<void> {
  await prisma.loginAttempt.create({ data: { email, succeeded } });
}

export const LOCKOUT_MESSAGE = `Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.`;

/**
 * Best-effort client IP from x-forwarded-for (set by most hosting platforms —
 * Vercel, most reverse proxies — but not guaranteed everywhere). Falls back to
 * a shared "unknown" bucket rather than skipping the check entirely: a fixed
 * ceiling on unattributed signups is safer than no ceiling at all.
 */
export async function getClientIpForRateLimit(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

const SIGNUP_WINDOW_MINUTES = 60;
const MAX_SIGNUPS_PER_IP = 10;

export async function isSignupRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - SIGNUP_WINDOW_MINUTES * 60 * 1000);
  const recentSignups = await prisma.signupAttempt.count({
    where: { ip, createdAt: { gte: since } },
  });
  return recentSignups >= MAX_SIGNUPS_PER_IP;
}

export async function recordSignupAttempt(ip: string): Promise<void> {
  await prisma.signupAttempt.create({ data: { ip } });
}

export const SIGNUP_RATE_LIMIT_MESSAGE = "Too many organisations created from this network recently. Try again later.";
