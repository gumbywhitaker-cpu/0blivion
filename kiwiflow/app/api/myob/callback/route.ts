import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { verifyMyobState, completeMyobConnection } from "@/lib/myob";
import { recordAuditLog } from "@/lib/audit";

// GET /api/myob/callback — MYOB redirects here with ?code=&state= after the
// user approves the connection on MYOB's own consent screen.
export async function GET(req: NextRequest) {
  const session = await requireSession();

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings?myob=error", req.url));
  }

  const stateOrgId = await verifyMyobState(state);
  if (!stateOrgId || stateOrgId !== session.organizationId) {
    return NextResponse.redirect(new URL("/settings?myob=error", req.url));
  }

  const ok = await completeMyobConnection(session.organizationId, code);
  if (!ok) {
    return NextResponse.redirect(new URL("/settings?myob=error", req.url));
  }

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "myob.connected",
    entityType: "Organization",
    entityId: session.organizationId,
  });

  return NextResponse.redirect(new URL("/settings?myob=connected", req.url));
}
