import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

/**
 * MYOB AccountRight accounting sync — a scaffold alongside lib/xero.ts, same
 * honesty standard: it needs a real MYOB Developer app (client ID/secret, a
 * registered HTTPS redirect URI) that only the operator can create at
 * my.myob.com's Developer tab; without MYOB_CLIENT_ID/MYOB_CLIENT_SECRET
 * configured, every function here fails closed. This has not been exercised
 * against MYOB's real API — there is no test MYOB account available in this
 * environment — so treat the OAuth/token/push code paths as
 * researched-but-unverified until run against a real connected account.
 *
 * MYOB AccountRight's shape differs from Xero's in one structural way worth
 * flagging: a business's accounting data lives in one or more "company
 * files," each with its own UID, and — separately from the OAuth token —
 * MYOB lets a company file require its own sign-in (the `x-myobapi-cftoken`
 * header, base64 of "username:password" for that specific file, distinct
 * from the developer's MYOB account used for OAuth). Storing that
 * credential is what myobCfUsername/myobCfPassword on Organization are for.
 * If a company file has no separate password set, cftoken can be sent as
 * base64("Username:") with an empty password — MYOB's public sandbox uses
 * exactly this shape ("APIDeveloper:").
 *
 * Endpoint/header facts here (authorize/token URLs, x-myobapi-key/-version
 * headers, the /accountright/ company-file list, the Sale/Invoice/{type}
 * path) come from MYOB's published developer docs. The exact JSON body
 * shape for POSTing a Sale/Invoice/Service was not independently verified
 * against a live schema in this environment — treat pushInvoiceToMyob's
 * request body as a best-effort mapping to confirm against MYOB's own
 * schema (developer.myob.com) before relying on it in production.
 */

const MYOB_AUTH_URL = "https://secure.myob.com/oauth2/account/authorize";
const MYOB_TOKEN_URL = "https://secure.myob.com/oauth2/v1/authorize";
const MYOB_API_BASE = "https://api.myob.com/accountright";
const MYOB_API_VERSION = "v2";

export function isMyobConfigured(): boolean {
  return Boolean(process.env.MYOB_CLIENT_ID && process.env.MYOB_CLIENT_SECRET && process.env.MYOB_REDIRECT_URI);
}

function getStateSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — see .env.example");
  return new TextEncoder().encode(secret);
}

/** Same short-lived signed state param pattern as lib/xero.ts. */
export async function signMyobState(organizationId: string): Promise<string> {
  return new SignJWT({ organizationId, purpose: "myob_oauth_state" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getStateSecretKey());
}

export async function verifyMyobState(state: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(state, getStateSecretKey());
    if (payload.purpose !== "myob_oauth_state" || typeof payload.organizationId !== "string") return null;
    return payload.organizationId;
  } catch {
    return null;
  }
}

export function getMyobAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MYOB_CLIENT_ID!,
    redirect_uri: process.env.MYOB_REDIRECT_URI!,
    response_type: "code",
    scope: "CompanyFile",
    prompt: "consent", // MYOB requires this to return company-file info on the redirect
    state,
  });
  return `${MYOB_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number };

function apiHeaders(accessToken: string, cfToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "x-myobapi-key": process.env.MYOB_CLIENT_ID!,
    "x-myobapi-version": MYOB_API_VERSION,
    "Content-Type": "application/json",
  };
  if (cfToken) headers["x-myobapi-cftoken"] = cfToken;
  return headers;
}

async function exchangeAndStore(organizationId: string, body: URLSearchParams): Promise<boolean> {
  body.set("client_id", process.env.MYOB_CLIENT_ID!);
  body.set("client_secret", process.env.MYOB_CLIENT_SECRET!);

  const tokenRes = await fetch(MYOB_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) return false;
  const token = (await tokenRes.json()) as TokenResponse;

  // Discover the connected company file(s) and take the first — same
  // known scaffold limitation as Xero's connections[0] pick: a business
  // with multiple company files needs a picker this doesn't have yet.
  const cfRes = await fetch(`${MYOB_API_BASE}/`, {
    headers: apiHeaders(token.access_token),
  });
  if (!cfRes.ok) return false;
  const companyFiles = (await cfRes.json()) as { Id: string }[];
  const companyFileUid = companyFiles[0]?.Id;
  if (!companyFileUid) return false;

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      myobCompanyFileUid: companyFileUid,
      myobAccessToken: token.access_token,
      myobRefreshToken: token.refresh_token,
      myobTokenExpires: new Date(Date.now() + token.expires_in * 1000),
    },
  });
  return true;
}

/** Called from the OAuth callback route after MYOB redirects back with a code. */
export async function completeMyobConnection(organizationId: string, code: string): Promise<boolean> {
  if (!isMyobConfigured()) return false;
  return exchangeAndStore(
    organizationId,
    new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.MYOB_REDIRECT_URI! }),
  );
}

/** Store the company file's own sign-in (separate from the OAuth account —
 * see this file's header comment). Called from a Settings form, not OAuth. */
export async function setMyobCompanyFileCredentials(
  organizationId: string,
  username: string,
  password: string,
): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { myobCfUsername: username, myobCfPassword: password },
  });
}

function cfTokenFor(org: { myobCfUsername: string | null; myobCfPassword: string | null }): string | null {
  if (!org.myobCfUsername) return null;
  return Buffer.from(`${org.myobCfUsername}:${org.myobCfPassword ?? ""}`).toString("base64");
}

async function getValidAccessToken(organizationId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org?.myobCompanyFileUid || !org.myobRefreshToken) return null;

  const stillValid = org.myobTokenExpires && org.myobTokenExpires.getTime() - Date.now() > 60_000;
  if (stillValid && org.myobAccessToken) return org.myobAccessToken;

  if (!isMyobConfigured()) return null;
  const refreshed = await exchangeAndStore(
    organizationId,
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: org.myobRefreshToken }),
  );
  if (!refreshed) return null;
  const updated = await prisma.organization.findUnique({ where: { id: organizationId } });
  return updated?.myobAccessToken ?? null;
}

export type MyobPushResult = { ok: true; myobInvoiceUid: string } | { ok: false; reason: string };

/** Pushes a KiwiFlow invoice to MYOB as an open/draft Service Sale invoice,
 * matched to the billed org by name (same known limitation as Xero: MYOB
 * can auto-create the Customer from a name it doesn't recognise, but won't
 * merge against an existing contact with a slightly different name). */
export async function pushInvoiceToMyob(invoiceId: string): Promise<MyobPushResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { toOrg: true, items: true },
  });
  if (!invoice) return { ok: false, reason: "Invoice not found" };
  if (invoice.myobInvoiceUid) return { ok: false, reason: "Already synced to MYOB" };

  const accessToken = await getValidAccessToken(invoice.fromOrgId);
  if (!accessToken) {
    return { ok: false, reason: "Not connected to MYOB, or the connection has expired — reconnect in Settings." };
  }
  const org = await prisma.organization.findUnique({ where: { id: invoice.fromOrgId } });
  const cfToken = cfTokenFor(org!);

  // Best-effort mapping to MYOB's Sale/Invoice/Service shape — see this
  // file's header comment on why this needs confirming against a live
  // MYOB schema before production use.
  const body = {
    Customer: { Name: invoice.toOrg.name },
    Date: (invoice.issuedAt ?? new Date()).toISOString().slice(0, 10),
    IsTaxInclusive: false,
    Lines: invoice.items.map((item) => ({
      Type: "Transaction",
      Description: item.description,
      Total: item.amount,
    })),
    Status: "Open",
  };

  let response: Response;
  try {
    response = await fetch(`${MYOB_API_BASE}/${org!.myobCompanyFileUid}/Sale/Invoice/Service`, {
      method: "POST",
      headers: apiHeaders(accessToken, cfToken),
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: "Couldn't reach MYOB — try again shortly." };
  }

  if (!response.ok) {
    return { ok: false, reason: `MYOB rejected the invoice (${response.status}).` };
  }

  const data = (await response.json()) as { UID?: string };
  const myobInvoiceUid = data.UID;
  if (!myobInvoiceUid) return { ok: false, reason: "MYOB didn't return an invoice UID." };

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { myobInvoiceUid, myobSyncedAt: new Date() },
  });

  return { ok: true, myobInvoiceUid };
}
