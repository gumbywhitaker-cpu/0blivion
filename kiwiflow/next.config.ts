import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

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
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: cspHeader },
  // Force HTTPS for a year, including subdomains, and allow browser preload
  // lists. Harmless to send over plain HTTP too — browsers ignore it there.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
