# Security controls

This document describes the security controls actually implemented in this
codebase, as of the date of the most recent change below. It exists so that
"is KiwiFlow secure" has a real, checkable answer instead of a marketing one.

**This is not a SOC 2 or ISO 27001 certification, and this document does not
claim to be one.** Those are third-party audits of an *organization's*
operational controls — access reviews, change management, incident response,
vendor management, HR processes — carried out over months by a licensed CPA
firm (SOC 2) or an accredited certification body (ISO 27001), and they cover
far more than code. No engineer, and no AI agent, can grant either
certification by writing software. If KiwiFlow pursues one of these in the
future, that requires engaging a real auditor and will need policies and
evidence beyond what's listed here — do not describe this app as "SOC 2
compliant" or "ISO 27001 certified" anywhere (marketing copy, sales
conversations, RFP responses) on the strength of this document alone.

What follows is the honest, current state of the technical controls that any
such audit would eventually check. For how these same controls map onto the
NIST Cybersecurity Framework (a self-assessed framework, not a certification
— there is nothing to be "NIST certified" in), see
`docs/NIST-CSF-MAPPING.md`.

## Authentication & session management

- Passwords hashed with bcrypt (`lib/auth/password.ts`), never stored or
  logged in plaintext.
- Sessions are signed JWTs (HS256, `lib/auth/session.ts`) in an `httpOnly`,
  `sameSite=lax` cookie, `secure` in production, 30-day expiry.
- Login and signup are rate-limited (`lib/auth/rateLimit.ts`): 5 failed
  login attempts per email locks out for 15 minutes; signup is capped at 10
  per hour per client IP (best-effort — `x-forwarded-for`-based, so it's only
  as trustworthy as the reverse proxy in front of the app).
- Optional TOTP-based MFA (`lib/auth/totp.ts`) — RFC 6238, ±1 step drift,
  `timingSafeEqual` comparison — with single-use, bcrypt-hashed backup codes.
  MFA verification is rate-limited the same way as password attempts.
- Disabling MFA requires both the password and a current TOTP code, not just
  an active session, so a left-open or stolen session alone can't turn
  protection off.

## Authorization & tenant isolation

- Every organization-scoped table carries `organizationId`, and every query
  site filters on `session.organizationId` at the application layer
  (Prisma `where: { organizationId: ... }`) — see `app/(app)/jobs/actions.ts`
  for the pattern repeated throughout `app/(app)/`.
- **This is application-layer isolation, not database-enforced row-level
  security.** Unlike the Hatchable deployment of KiwiFlow (which runs on
  Postgres with genuine RLS policies), this Next.js app's SQLite/Prisma stack
  has no equivalent database-level backstop — a call site that forgets the
  `organizationId` filter is a real cross-tenant data leak, not caught by
  anything below the application code. This is the single biggest structural
  gap between this codebase and what a SOC 2 auditor would want to see for
  a multi-tenant system, and the honest fix is either disciplined code review
  of every new query, or migrating to Postgres + RLS to get a real backstop.
- `ADMIN` is a deliberate, single, platform-wide exception to tenant
  isolation (`lib/auth/requireRole.ts`) — not reachable via self-serve signup
  (`SELF_SERVE_ORG_TYPES` excludes it), only created via
  `scripts/create-admin.ts`. Every view of the admin overview is written to
  the audit log (see below).
- Role checks (`OWNER`/`MANAGER` can mutate, `assertCanManage`) are enforced
  server-side in every Server Action, not just hidden in the UI.

## Audit logging

- `lib/audit.ts` writes to the `AuditLog` table (organization-scoped actor,
  action, entity, timestamp, JSON detail) for: signup, login success/failure,
  MFA enable/disable/failed-verification, ADMIN cross-org access, material
  order creation/status changes, broadcast sends, driver assignment on
  transport jobs, wage/hours entries (`time_entry.logged`,
  `piece_rate.logged`), biosecurity findings
  (`biosecurity.finding_recorded`), packhouse grading results
  (`grading_result.recorded`/`.updated`), minimum-wage top-up payments
  (`wage_top_up.recorded`), health & safety incident reports
  (`safety_incident.reported`), certification status changes
  (`certification.recorded`/`.status_changed`), and Xero invoice pushes
  (`xero.invoice_pushed`/`.invoice_push_failed`). Job status changes have
  their own dedicated `JobStatusHistory` table instead, which already covers
  that domain in more detail than the generic log needs to duplicate.
- Audit writes never block or fail the action they're recording — a broken
  audit write logs to stderr rather than breaking a user's login. In a real
  deployment, stderr needs to go to a monitored log sink, not vanish.
- Visible in-app: every user sees their own org's recent security activity
  in Settings; ADMIN sees the cross-org feed on the Admin overview page.
- **Gap**: `HarvestMaturityTest` and `SprayDiaryEntry` creation, and invoice
  generation/status transitions (send/mark-paid) and org settings changes,
  still aren't writing to this log — only the newer Xero push action is.
  Extend `recordAuditLog()` calls to those action files as they come up for
  review.

## API routes outside the Server Action model

- `app/api/v1/jobs/transition` exists specifically for the Contractor Hub's
  offline sync queue (`lib/offline/`) — a stable REST endpoint a service
  worker/IndexedDB queue can retry, since Server Actions have opaque,
  per-build action IDs that can't be replayed later. It shares the exact
  same authorization and status-machine logic as the Server Action version
  (`lib/jobTransition.ts`), not a separate, potentially-drifting copy.
- It relies on the same `sameSite=lax` session cookie for CSRF protection as
  every other authenticated route in this app (no separate CSRF token) —
  Lax withholds the cookie on cross-site subrequests, which is what actually
  stops a forged cross-origin POST here, same trust model as the existing
  CSV export routes under `app/api/v1/export/`.
- Uses `getSession()` (returns `null`) rather than `requireSession()`
  (redirects) on failure, since a `fetch()` caller needs a real 401 JSON
  body, not an HTML redirect to `/login`.

## Network & browser-facing controls

- `next.config.ts` sends `Strict-Transport-Security`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, and a `Permissions-Policy` denying
  camera/microphone/geolocation/payment (nothing in the app uses them).
- A `Content-Security-Policy` is set on every response: `default-src 'self'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `frame-ancestors 'none'`, blocking all third-party/cross-origin script and
  resource loading and framing (clickjacking).
  - **Known limitation, deliberately accepted**: `script-src` and `style-src`
    include `'unsafe-inline'`. A stricter nonce-based CSP
    (`'nonce-...' 'strict-dynamic'`, no `'unsafe-inline'`) was implemented
    and tested first — it's the pattern Next.js's own docs recommend
    (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`)
    — but verified broken in this exact stack: Next.js 16.3.1 on Turbopack
    does not tag its own framework/hydration `<script>` tags with the
    per-request nonce, so `'strict-dynamic'` ended up blocking Next's own
    same-origin chunks and would have broken every page in production. This
    was caught with a real headless-browser check (Playwright, watching for
    actual CSP console violations), not assumed from documentation. Worth
    revisiting on a future Next.js/Turbopack upgrade that fixes nonce
    propagation — check for CSP violations with a real browser before
    tightening this, not just a clean build.

## Data handling

- **RSE/seasonal-labour payroll data** (`TimeEntry`, `PieceRateRecord`,
  and the `CrewMember.minGuaranteedHoursPerWeek` threshold): this is
  worker PII plus wage data, scoped by the same `organizationId`
  application-layer filtering as everything else — no separate access
  control tier for it. The "under threshold" flag `lib/payroll.ts`
  computes is an operator-configured heads-up, not a legal compliance
  determination — it must not be presented to a customer or auditor as
  proof of RSE Agreement-to-Recruit compliance.
- `AuditLog`, `LoginAttempt`, and `SignupAttempt` retention: currently
  unbounded — no automatic pruning job exists yet. Needed before this can
  be called a real data retention policy.
- CSV export endpoints (`app/api/v1/export/*.csv`) are session-gated and
  organization-scoped like everything else in `app/(app)/`.
- **Minimum-wage top-up data** (`WageTopUp`) and **health & safety incident
  reports** (`SafetyIncident`) are worker PII in the same sense as
  `TimeEntry`/`PieceRateRecord` above — org-scoped like everything else, no
  separate access tier. `SafetyIncident.injuryInvolved` and free-text
  `description`/`actionTaken` fields can contain sensitive personal/medical
  detail (an injury description); a `CRITICAL` severity report is only ever
  a heads-up that the finding *may* meet the Health and Safety at Work Act
  2015's definition of a notifiable event — KiwiFlow does not submit
  anything to WorkSafe, and this must never be represented to a customer as
  a compliance action having been taken.
- **Xero OAuth tokens** (`Organization.xeroAccessToken`/`xeroRefreshToken`)
  are stored as plain columns with no field-level encryption — the same gap
  as `AUTH_SECRET` below, but concretely worse here: a refresh token is a
  long-lived credential to a customer's real accounting system, not just to
  this app. This needs a real secrets-at-rest story (column-level encryption
  or a secrets manager with envelope encryption) before Xero sync goes from
  scaffold to something a real customer connects a production Xero org to.
- **AI grading photos** (`lib/aiGrading.ts`): sent to the Anthropic Messages
  API as part of a single request for a one-off visual estimate, never
  written to disk or a database column on this app's side. Subject to
  Anthropic's own data-handling terms for API traffic, not this app's —
  that's a real third-party data flow worth disclosing to a customer even
  though nothing is retained here.
- No field-level encryption beyond what SQLite/the hosting platform provides
  at rest, and no secrets manager — `AUTH_SECRET` and friends are plain
  environment variables (`.env.example`). Fine for the current single-app
  deployment; would need revisiting (e.g. a real secrets manager, rotation
  policy) before an audit.

## Dependency management

- `.github/dependabot.yml` (repo root) tracks the `kiwiflow/` npm manifest
  weekly, with security-relevant updates surfaced as individual PRs rather
  than batched with routine version bumps.
- Known current finding (`npm audit`, high severity): `deepmerge-ts <8.0.0`
  (GHSA-ggr8-5vv4-36mx, stack exhaustion), pulled in transitively via
  `@prisma/config` → `prisma`. This is the `prisma` CLI/config-loading
  package, not `@prisma/client` — it isn't on the request-serving path — so
  practical exploitability in production is low, but it's a real advisory
  and not swept under the rug. `npm audit fix --force`'s suggested
  resolution points at a nonexistent stable release range
  (`6.13.0-dev.1 - 7.10.0-integration-fix-prisma-publish-token.1`); wait for
  a real upstream fix rather than force-installing a prerelease.

## What isn't covered here

Physical/cloud infrastructure security, employee access management, incident
response process, vendor risk management, backup/disaster-recovery testing,
and every other organizational control a real audit examines are outside
what a codebase's SECURITY.md can speak to — those live in the hosting
provider's controls and in KiwiFlow's own operating procedures, not here.
