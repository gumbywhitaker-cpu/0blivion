import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireApiBusiness } from "@/lib/api-auth";
import { exchangeXeroCode } from "@/lib/integrations";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  let business, membership;
  try {
    ({ business, membership } = await requireApiBusiness("integrations:manage"));
  } catch {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  if (errorParam) {
    return NextResponse.redirect(new URL("/app/integrations?error=xero_denied", appUrl));
  }

  const store = await cookies();
  const expectedState = store.get("oauth_state_xero")?.value;
  store.delete("oauth_state_xero");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/app/integrations?error=xero_state_mismatch", appUrl));
  }

  try {
    const tokens = await exchangeXeroCode(code);
    await prisma.integration.upsert({
      where: { businessId_provider: { businessId: business.id, provider: "XERO" } },
      update: {
        status: "CONNECTED",
        metadata: JSON.stringify({
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        }),
        lastSyncAt: new Date(),
      },
      create: {
        businessId: business.id,
        provider: "XERO",
        status: "CONNECTED",
        metadata: JSON.stringify({
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        }),
        lastSyncAt: new Date(),
      },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "integration.connected",
      entityType: "Integration",
      metadata: { provider: "XERO" },
    });

    return NextResponse.redirect(new URL("/app/integrations?connected=xero", appUrl));
  } catch (err) {
    console.error("Xero OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/app/integrations?error=xero_exchange_failed", appUrl));
  }
}
