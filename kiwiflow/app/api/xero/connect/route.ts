import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { isXeroConfigured, getXeroAuthUrl, signXeroState } from "@/lib/xero";

// GET /api/xero/connect — starts the OAuth flow. requireSession() redirects
// to /login on its own if there's no session, matching every other
// authenticated page in this app.
export async function GET() {
  const session = await requireSession();

  if (!isXeroConfigured()) {
    return NextResponse.json(
      { error: "not_configured", message: "Xero isn't configured on this deployment yet." },
      { status: 503 },
    );
  }

  const state = await signXeroState(session.organizationId);
  return NextResponse.redirect(getXeroAuthUrl(state));
}
