import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Optimistic auth check only (Next's own guidance: Proxy is not a full session/authz
// solution). Every protected page still calls requireSession() server-side — this
// just avoids rendering a protected shell before bouncing to /login.
const SESSION_COOKIE_NAME = "kf_session";

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const isAuthed = await hasValidSession(request);

  if (!isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/grower/:path*",
    "/contractor/:path*",
    "/orchards/:path*",
    "/contractors/:path*",
    "/crews/:path*",
    "/jobs/:path*",
    "/invoices/:path*",
    "/notifications/:path*",
    "/admin/:path*",
  ],
};
