import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

/**
 * Xero accounting sync — a scaffold, not a working live integration out of
 * the box. It needs a real Xero Developer app (client ID/secret, a
 * registered redirect URI) that only the operator can create at
 * developer.xero.com; without XERO_CLIENT_ID/XERO_CLIENT_SECRET configured,
 * every function here fails closed with a clear reason, same adapter-point
 * pattern as lib/notify.ts and lib/aiGrading.ts. This has not been
 * exercised against Xero's real API — there is no test Xero app available
 * in this environment — so treat the OAuth/token/push code paths as
 * reviewed-but-unverified until run against a real connected account.
 */

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

export function isXeroConfigured(): boolean {
  return Boolean(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET && process.env.XERO_REDIRECT_URI);
}

function getStateSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — see .env.example");
  return new TextEncoder().encode(secret);
}

/** Short-lived signed state param — prevents a forged callback from
 * connecting Xero to the wrong organisation. Same HS256/jose pattern as
 * lib/auth/session.ts's MFA-pending token. */
export async function signXeroState(organizationId: string): Promise<string> {
  return new SignJWT({ organizationId, purpose: "xero_oauth_state" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getStateSecretKey());
}

export async function verifyXeroState(state: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(state, getStateSecretKey());
    if (payload.purpose !== "xero_oauth_state" || typeof payload.organizationId !== "string") return null;
    return payload.organizationId;
  } catch {
    return null;
  }
}

export function getXeroAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.XERO_CLIENT_ID!,
    redirect_uri: process.env.XERO_REDIRECT_URI!,
    scope: "openid profile email accounting.transactions accounting.contacts offline_access",
    state,
  });
  return `${XERO_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number };

async function exchangeAndStore(organizationId: string, body: URLSearchParams): Promise<boolean> {
  const basicAuth = Buffer.from(`${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth}` },
    body,
  });
  if (!tokenRes.ok) return false;
  const token = (await tokenRes.json()) as TokenResponse;

  const connRes = await fetch(XERO_CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!connRes.ok) return false;
  const connections = (await connRes.json()) as { tenantId: string }[];
  const tenantId = connections[0]?.tenantId;
  if (!tenantId) return false;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      xeroTenantId: tenantId,
      xeroAccessToken: token.access_token,
      xeroRefreshToken: token.refresh_token,
      xeroTokenExpires: new Date(Date.now() + token.expires_in * 1000),
    },
  });
  return true;
}

/** Called from the OAuth callback route after Xero redirects back with a code. */
export async function completeXeroConnection(organizationId: string, code: string): Promise<boolean> {
  if (!isXeroConfigured()) return false;
  return exchangeAndStore(
    organizationId,
    new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.XERO_REDIRECT_URI! }),
  );
}

/** Returns a valid access token for the org, refreshing it first if it's
 * expired or close to it. Null if the org isn't connected, or the refresh
 * itself fails (Xero refresh tokens can expire or be revoked). */
async function getValidAccessToken(organizationId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org?.xeroTenantId || !org.xeroRefreshToken) return null;

  const stillValid = org.xeroTokenExpires && org.xeroTokenExpires.getTime() - Date.now() > 60_000;
  if (stillValid && org.xeroAccessToken) return org.xeroAccessToken;

  if (!isXeroConfigured()) return null;
  const refreshed = await exchangeAndStore(
    organizationId,
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: org.xeroRefreshToken }),
  );
  if (!refreshed) return null;
  const updated = await prisma.organization.findUnique({ where: { id: organizationId } });
  return updated?.xeroAccessToken ?? null;
}

export type XeroPushResult = { ok: true; xeroInvoiceId: string } | { ok: false; reason: string };

/** Pushes a KiwiFlow invoice to Xero as a draft ACCREC (accounts
 * receivable) invoice, matched to the billed org by name — Xero can
 * auto-create the contact from a Name if none matches, but won't merge
 * against an existing contact with a slightly different name. That's a
 * known scaffold limitation, not something this function can fix without a
 * stored Xero contact ID per organisation, which doesn't exist yet. */
export async function pushInvoiceToXero(invoiceId: string): Promise<XeroPushResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { toOrg: true, items: true },
  });
  if (!invoice) return { ok: false, reason: "Invoice not found" };
  if (invoice.xeroInvoiceId) return { ok: false, reason: "Already synced to Xero" };

  const accessToken = await getValidAccessToken(invoice.fromOrgId);
  if (!accessToken) {
    return { ok: false, reason: "Not connected to Xero, or the connection has expired — reconnect in Settings." };
  }
  const org = await prisma.organization.findUnique({ where: { id: invoice.fromOrgId } });

  const body = {
    Type: "ACCREC",
    Contact: { Name: invoice.toOrg.name },
    Date: (invoice.issuedAt ?? new Date()).toISOString().slice(0, 10),
    DueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : undefined,
    LineItems: invoice.items.map((item) => ({
      Description: item.description,
      Quantity: item.quantity,
      UnitAmount: item.rate,
      AccountCode: "200", // Xero's default Sales account code — the real code depends on the connected org's chart of accounts, not something KiwiFlow can know in advance
    })),
    Status: "DRAFT",
  };

  let response: Response;
  try {
    response = await fetch(`${XERO_API_BASE}/Invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Xero-tenant-id": org!.xeroTenantId!,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: "Couldn't reach Xero — try again shortly." };
  }

  if (!response.ok) {
    return { ok: false, reason: `Xero rejected the invoice (${response.status}).` };
  }

  const data = (await response.json()) as { Invoices?: { InvoiceID: string }[] };
  const xeroInvoiceId = data.Invoices?.[0]?.InvoiceID;
  if (!xeroInvoiceId) return { ok: false, reason: "Xero didn't return an invoice ID." };

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { xeroInvoiceId, xeroSyncedAt: new Date() },
  });

  return { ok: true, xeroInvoiceId };
}
