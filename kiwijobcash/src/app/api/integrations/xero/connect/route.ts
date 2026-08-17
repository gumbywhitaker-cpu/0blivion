import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { requireApiBusiness } from "@/lib/api-auth";
import { xeroOAuthConfigured, buildXeroAuthUrl } from "@/lib/integrations";

export async function GET() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  try {
    await requireApiBusiness("integrations:manage");
  } catch {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  if (!xeroOAuthConfigured()) {
    return NextResponse.redirect(new URL("/app/integrations?error=xero_not_configured", appUrl));
  }

  const state = randomUUID();
  const store = await cookies();
  store.set("oauth_state_xero", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildXeroAuthUrl(state));
}
