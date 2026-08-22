import { prisma } from "@/lib/db";
import type { NotificationUrgency } from "@/lib/types";

/**
 * Channel fan-out by urgency (docs/BLUEPRINT.md Section 0.3 / 12):
 *   NORMAL   -> in-app only
 *   URGENT   -> in-app + email
 *   CRITICAL -> in-app + email + SMS
 * Email is wired to Resend (api.resend.com/emails) below. SMS remains a stub.
 * Both fail closed (log + no-op) rather than throwing, so a missing provider
 * key never blocks the operation that triggered the notification (e.g.
 * marking a job complete) — same adapter-point pattern as lib/aiGrading.ts.
 */

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!apiKey) {
    console.warn("[notify] EMAIL_PROVIDER_API_KEY not configured — email not sent");
    return;
  }
  // EMAIL_FROM_ADDRESS must be on a domain verified in the Resend dashboard
  // for real delivery beyond Resend's own test inbox — see .env.example.
  const from = process.env.EMAIL_FROM_ADDRESS || "KiwiFlow <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: `<p>${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[notify] Resend send failed", { status: response.status, body: text.slice(0, 300) });
    }
  } catch (err) {
    console.error("[notify] Resend send threw", err);
  }
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
