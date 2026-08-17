import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";

const SESSION_COOKIE = "kjc_session";

/**
 * Optimistic route guard. This only checks that a valid session cookie is
 * present before letting the request through to /app or /admin — it does NOT
 * check business membership, roles, or admin status. Every page and API route
 * still performs its own authoritative check (requireBusiness/requireSuperAdmin/
 * requireApiBusiness) because Proxy runs before real data access and must stay
 * fast. Treat this as UX (fast redirect to /login), not the security boundary.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/admin");
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
