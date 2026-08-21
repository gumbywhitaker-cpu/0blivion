import { prisma } from "@/lib/db";
import type { NotificationUrgency } from "@/lib/types";

/**
 * Channel fan-out by urgency (docs/BLUEPRINT.md Section 0.3 / 12):
 *   NORMAL   -> in-app only
 *   URGENT   -> in-app + email
 *   CRITICAL -> in-app + email + SMS
 * Only in-app is implemented. Email/SMS adapters below fail closed (log + no-op)
 * rather than throwing, so a missing provider key never blocks the operation that
 * triggered the notification (e.g. marking a job complete).
 */

async function sendEmail(_to: string, _subject: string, _body: string): Promise<void> {
  if (!process.env.EMAIL_PROVIDER_API_KEY) {
    console.warn("[notify] EMAIL_PROVIDER_API_KEY not configured — email not sent");
    return;
  }
  // Adapter point: wire a real provider (e.g. Resend, SES) here.
}

async function sendSms(_to: string, _body: string): Promise<void> {
  if (!process.env.SMS_PROVIDER_API_KEY) {
    console.warn("[notify] SMS_PROVIDER_API_KEY not configured — SMS not sent");
    return;
  }
  // Adapter point: wire a real provider (e.g. Twilio) here.
}

export async function notifyUser(params: {
  organizationId: string;
  userId: string;
  title: string;
  body: string;
  urgency?: NotificationUrgency;
  jobId?: string;
}): Promise<void> {
  const urgency = params.urgency ?? "NORMAL";

  await prisma.notification.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      jobId: params.jobId,
      urgency,
      title: params.title,
      body: params.body,
    },
  });

  if (urgency === "URGENT" || urgency === "CRITICAL") {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (user) await sendEmail(user.email, params.title, params.body);
  }
  if (urgency === "CRITICAL") {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (user?.phone) await sendSms(user.phone, `${params.title}: ${params.body}`);
  }
}

/** Notify every OWNER in an org — used for org-wide events like job completion. */
export async function notifyOrgOwners(params: {
  organizationId: string;
  title: string;
  body: string;
  urgency?: NotificationUrgency;
  jobId?: string;
}): Promise<void> {
  const owners = await prisma.user.findMany({
    where: { organizationId: params.organizationId, role: "OWNER" },
  });
  for (const owner of owners) {
    await notifyUser({ ...params, userId: owner.id });
  }
}

/**
 * Notify every user in an org, not just OWNERs — for things meant to reach
 * everyone who might act on them immediately (a mass broadcast, an incoming
 * delivery), where waiting for the owner to relay it defeats the point.
 */
export async function notifyOrg(params: {
  organizationId: string;
  title: string;
  body: string;
  urgency?: NotificationUrgency;
  jobId?: string;
}): Promise<void> {
  const users = await prisma.user.findMany({
    where: { organizationId: params.organizationId },
  });
  for (const user of users) {
    await notifyUser({ ...params, userId: user.id });
  }
}
