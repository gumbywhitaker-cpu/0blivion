import "server-only";
import { prisma } from "@/lib/db";

export type IntegrationProvider = "XERO" | "GOOGLE" | "TWILIO" | "ZAPIER";

export type IntegrationDef = {
  provider: IntegrationProvider;
  name: string;
  description: string;
  kind: "oauth" | "apikey" | "webhook";
  configured: boolean;
};

export function googleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function xeroOAuthConfigured() {
  return Boolean(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET);
}

export function getIntegrationDefs(): IntegrationDef[] {
  return [
    {
      provider: "XERO",
      name: "Xero",
      description: "Sync invoices and payments so your books and Kiwi Job Cash always agree.",
      kind: "oauth",
      configured: xeroOAuthConfigured(),
    },
    {
      provider: "GOOGLE",
      name: "Google (Gmail & Calendar)",
      description: "Send follow-ups from your own Gmail address and book jobs straight into your calendar.",
      kind: "oauth",
      configured: googleOAuthConfigured(),
    },
    {
      provider: "TWILIO",
      name: "Twilio SMS",
      description: "Send follow-up and reminder texts from your own Twilio number.",
      kind: "apikey",
      configured: true,
    },
    {
      provider: "ZAPIER",
      name: "Zapier",
      description: "Push Kiwi Job Cash events to 6,000+ apps via a Zapier webhook.",
      kind: "webhook",
      configured: true,
    },
  ];
}

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
];

export function buildGoogleAuthUrl(state: string) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${appUrl}/api/integrations/google/callback`,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES.join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${appUrl}/api/integrations/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number; id_token?: string }>;
}

const XERO_SCOPES = ["openid", "profile", "email", "accounting.transactions", "accounting.contacts", "offline_access"];

export function buildXeroAuthUrl(state: string) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.XERO_CLIENT_ID ?? "",
    redirect_uri: `${appUrl}/api/integrations/xero/callback`,
    scope: XERO_SCOPES.join(" "),
    state,
  });
  return `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
}

export async function exchangeXeroCode(code: string) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const basicAuth = Buffer.from(
    `${process.env.XERO_CLIENT_ID ?? ""}:${process.env.XERO_CLIENT_SECRET ?? ""}`
  ).toString("base64");
  const res = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/integrations/xero/callback`,
    }),
  });
  if (!res.ok) throw new Error(`Xero token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number }>;
}

/** Fires a Zapier webhook if one's connected for this business. Never throws — best-effort. */
export async function triggerZapierWebhook(
  businessId: string,
  event: string,
  payload: Record<string, unknown>
) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { businessId_provider: { businessId, provider: "ZAPIER" } },
    });
    if (integration?.status !== "CONNECTED" || !integration.metadata) return;
    const { webhookUrl } = JSON.parse(integration.metadata) as { webhookUrl?: string };
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...payload }),
    });
  } catch (err) {
    console.error("Zapier webhook failed:", err);
  }
}
