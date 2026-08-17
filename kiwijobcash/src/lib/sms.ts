import "server-only";
import { prisma } from "@/lib/db";

export type SendSmsResult = { delivered: boolean; reason?: string };

/**
 * Minimal SMS adapter over Twilio's REST API (no SDK dependency, matches the
 * lib/email.ts pattern). Reads per-business credentials saved via
 * Settings > Integrations > Twilio, falling back to env vars for a
 * single-tenant deployment. Never pretends a message sent when it didn't.
 */
export async function sendSms(businessId: string, params: { to: string; body: string }): Promise<SendSmsResult> {
  const integration = await prisma.integration.findUnique({
    where: { businessId_provider: { businessId, provider: "TWILIO" } },
  });

  const creds = integration?.status === "CONNECTED" && integration.metadata ? JSON.parse(integration.metadata) : null;

  const accountSid = creds?.accountSid ?? process.env.TWILIO_ACCOUNT_SID;
  const authToken = creds?.authToken ?? process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = creds?.fromNumber ?? process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[sms:not-configured] To: ${params.to} — ${params.body.slice(0, 40)}...`);
    return { delivered: false, reason: "not_configured" };
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: params.to, From: fromNumber, Body: params.body }),
    });
    if (!res.ok) {
      console.error("SMS send failed:", await res.text());
      return { delivered: false, reason: "provider_error" };
    }
    return { delivered: true };
  } catch (err) {
    console.error("SMS send failed:", err);
    return { delivered: false, reason: "provider_error" };
  }
}

/** Validates Twilio credentials by fetching the account resource. */
export async function verifyTwilioCredentials(accountSid: string, authToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
