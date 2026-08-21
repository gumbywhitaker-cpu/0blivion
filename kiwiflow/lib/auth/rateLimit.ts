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
