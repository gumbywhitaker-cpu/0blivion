import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { isMyobConfigured, getMyobAuthUrl, signMyobState } from "@/lib/myob";

// GET /api/myob/connect — starts the OAuth flow.
export async function GET() {
  const session = await requireSession();

  if (!isMyobConfigured()) {
    return NextResponse.json(
      { error: "not_configured", message: "MYOB isn't configured on this deployment yet." },
      { status: 503 },
    );
  }

  const state = await signMyobState(session.organizationId);
  return NextResponse.redirect(getMyobAuthUrl(state));
}
