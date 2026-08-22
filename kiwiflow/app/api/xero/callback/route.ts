import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { verifyXeroState, completeXeroConnection } from "@/lib/xero";
import { recordAuditLog } from "@/lib/audit";

// GET /api/xero/callback — Xero redirects here with ?code=&state= after the
// user approves the connection on Xero's own consent screen.
export async function GET(req: NextRequest) {
  const session = await requireSession();

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?xero=error", req.url));
  }

  const stateOrgId = await verifyXeroState(state);
  if (!stateOrgId || stateOrgId !== session.organizationId) {
    return NextResponse.redirect(new URL("/settings?xero=error", req.url));
  }

  const ok = await completeXeroConnection(session.organizationId, code);
  if (!ok) {
    return NextResponse.redirect(new URL("/settings?xero=error", req.url));
  }

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "xero.connected",
    entityType: "Organization",
    entityId: session.organizationId,
  });

  return NextResponse.redirect(new URL("/settings?xero=connected", req.url));
}
