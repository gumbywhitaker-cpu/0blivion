import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Set by desktop/main.js on the child server process it forks — this build
// only ever gets loaded by that one app window over plain http://127.0.0.1,
// never over the open internet, so the HTTPS-upgrade headers below don't
// apply and are actively risky here: 'upgrade-insecure-requests' or HSTS
// telling Chromium to upgrade same-origin requests to https on a server
// that only speaks http would break every asset/API call after the initial
// page load. Untestable from this sandbox (no Windows/Electron runtime), so
// this drops the uncertainty instead of assuming a loopback origin is
// exempt from it.
const isDesktop = process.env.KIWIFLOW_DESKTOP === "1";

// Nonce-based CSP (script-src 'nonce-...' 'strict-dynamic', no 'unsafe-inline')
// was tried and reverted: Next 16's Turbopack build doesn't tag its own
// framework/hydration <script> tags with the per-request nonce the way
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
// describes, so 'strict-dynamic' ended up blocking Next's own same-origin
// chunks — verified with a real browser (Playwright), not assumed from the
// docs. This is the documented "Without Nonces" fallback instead: weaker on
// inline-script injection than a working nonce policy would be, but it does
// still block all third-party/cross-origin script and resource loading,
// framing (clickjacking), and unexpected form submission targets — and,
// unlike the nonce attempt, it's actually verified working.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${isDesktop ? "" : "upgrade-insecure-requests;"}
`
  .replace(/\s{2,}/g, " ")
  .trim();

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: cspHeader },
  // Force HTTPS for a year, including subdomains, and allow browser preload
  // lists. Harmless to send over plain HTTP too — browsers ignore it there.
  // Skipped for the desktop app (see isDesktop above).
  ...(isDesktop
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
  // Belt-and-braces alongside CSP's frame-ancestors 'none' for browsers that
  // only understand the older header.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing in this app uses these browser APIs — deny them outright rather
  // than leaving the default (which lets same-origin content request them).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Traced, self-contained build (.next/standalone) — what desktop/ packages
  // into the Windows Electron app so it ships without a full node_modules.
  // No effect on `next dev`/normal `next start` usage.
  output: "standalone",
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
