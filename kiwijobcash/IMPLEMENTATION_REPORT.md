# Kiwi Job Cash — Implementation Report

*"Find the money you're losing" — an AI revenue-recovery platform for New Zealand tradies and small businesses.*

This report covers what was built against the master build prompt, how it's put together, what's
still needed before a real launch, and what to do next.

## 1. What was built

A working, multi-tenant Next.js 16 SaaS application — not a prototype. Every screen reads and writes
real data through Prisma; there are no hard-coded numbers, fake integrations, or mocked API responses
anywhere in the app. Where a feature depends on a third-party credential that isn't configured in this
environment (Stripe, Twilio, Google, Xero, Resend, Anthropic), the app says so plainly instead of
pretending it worked.

**Core product** (all fully functional, not scaffolding):
- Auth: signup/login/logout, email verification, password reset — bcrypt + signed JWT session cookies
- Onboarding: 7-step wizard ending in a personalised "Money Map" opportunity estimate
- Multi-tenant business model with 5-level role hierarchy (Owner → Read Only), enforced server-side
- Full CRUD: Customers, Leads, Quotes, Invoices, Jobs, Expenses, Payments
- Money engine: money-at-risk, recovery score, money-recovered — all computed live from real records
- AI Action Centre: 5 independent rule-based agents (lead, quote, invoice, customer, profit) producing
  reviewable, editable, approve-before-send recommendations — automation is **off by default**
- Ask Kiwi: natural-language Q&A over the business's own data, deterministic answers with optional
  LLM rewording (never fact generation)
- Profit Radar: revenue/cost/margin reporting with every figure labelled Reported/Estimated/Projected
- Money Leak Scan: public, no-signup lead-gen funnel with a transparent, disclosed estimate formula
- Demo mode: one-click, fully isolated "Dave's Plumbing" business with realistic seeded data
- Marketing site: home, pricing, features, 8 industry pages, how-it-works, security, FAQ, contact
- Billing: Stripe Checkout + Billing Portal + webhook sync, plan-based usage limits, 80%-quota banner
- Settings: business profile, team invites (role-based), automation toggles, billing
- Integrations: CSV customer import, Xero + Google OAuth scaffolding, Twilio SMS, Zapier webhooks
- Super-admin console: platform overview (MRR, plan mix, signups), business lookup, support queue

## 2. Architecture

- **Framework**: Next.js 16.3.1 (App Router, Turbopack, React Server Components)
- **Database**: Prisma ORM 7 against SQLite locally (`@prisma/adapter-better-sqlite3`) — swaps to
  Postgres in one file (`src/lib/db.ts`) via `@prisma/adapter-pg` for production
- **Schema**: 28 models, 3 migrations applied (`prisma/migrations/`)
- **Auth**: custom-built (bcryptjs + `jose` JWT), not a library — gave full control over the
  `{userId, businessId}` session shape multi-tenancy needs. `src/proxy.ts` does optimistic route
  gating; every page and API route re-verifies authorization server-side (defense in depth)
- **Styling**: Tailwind v4, CSS-token based theme, light/dark via `prefers-color-scheme`
- **AI**: `@anthropic-ai/sdk`, model `claude-haiku-4-5`, used only to reword already-computed
  deterministic text — every numeric fact in the app is computed by plain TypeScript, never by the LLM
- **Validation**: Zod on every API input
- **187 source files** — 46 API routes, 47 pages

## 3. Data model highlights

Every business-owned table carries `businessId`. Two enforcement layers exist and are used
consistently everywhere, never bypassed:
- `requireApiBusiness(permission?)` for API routes — throws a typed `ApiError`, never trusts a
  business ID from the client, resolves it from the signed session only
- `requireBusiness()` for Server Component pages — redirects to `/login` or `/onboarding`

Full model list: User, PasswordResetToken, EmailVerificationToken, Business, BusinessMember,
Customer, Lead, Quote, Invoice, Payment, Job, Expense, AIAction, AIConversation, Notification,
Integration, Subscription, Usage, AutomationSettings, AuditLog, LeadGenerationScan, Event, Referral,
Prospect, FeatureRequest, Feedback, NPSResponse, SupportRequest.

## 4. AI agents

Five independent, rule-based agents (`src/lib/agents/`) each scan one part of the business and emit
`ActionCandidate` objects — never raw LLM output:

| Agent | Flags |
|---|---|
| Lead recovery | Leads untouched ≥2 days or past their follow-up date |
| Quote recovery | Quotes gone quiet since the plan's reminder threshold (default 3 days) |
| Invoice recovery | Overdue invoices, with tone escalating Friendly → Firm → Final |
| Customer reactivation | Dormant/VIP customers with no contact in 180 days (never estimates value without job history) |
| Profit radar | One alert when gross margin is declining month-over-month |

An orchestrator (`runAgents`) upserts these into `AIAction` rows keyed by `type::entityType::entityId`
— idempotent, so it never resurrects a dismissed or already-sent action on the next page load. Every
action requires explicit human approval before anything sends; **automatic sending is off by default**
and is a named toggle in Settings → Automation.

## 5. Subscription plans

Centralised in `src/lib/plans.ts` — nothing else in the codebase hard-codes a price:

| Plan | Price/mo (NZD) | AI actions/mo | Users |
|---|---|---|---|
| Free | $0 | 10 | 1 |
| Solo | $29 | 100 | 1 |
| Pro | $59 | 500 | 3 |
| Crew | $99 | 1,500 | 10 |

Billing is wired to real Stripe Checkout/Portal/webhook endpoints. Without `STRIPE_SECRET_KEY` set,
every billing action returns a clear "not configured" message rather than faking success.

## 6. Integrations

| Integration | Kind | Status without credentials |
|---|---|---|
| Xero | OAuth (CSRF-protected state cookie) | "Not configured" — button disabled |
| Google (Gmail send + Calendar) | OAuth | "Not configured" — button disabled |
| Twilio | API key, verified against Twilio's API on save | Form shown, save fails clearly on bad creds |
| Zapier | Webhook URL, pinged on save to confirm reachability | Form shown, saved with a warning if unreachable |
| CSV import | None needed — fully functional today | N/A |

`money_recovered` events fire a best-effort Zapier webhook when connected.

## 7. Security controls

- Tenant isolation: every mutating/detail API route audited — all use `findFirst({ id, businessId })`
  or equivalent, never a bare `findUnique({ id })`. No gaps found in this pass.
- Server-side permission checks on every mutating route via `hasPermission(role, permission)`
- Passwords: bcrypt hashed, never logged or returned in any API response
- Password reset / email verification tokens: single-use (`usedAt`), time-limited, checked atomically
- Sessions: signed JWT (`jose`, HS256), httpOnly + `secure` (in production) + `sameSite=lax` cookie
- OAuth flows (Xero, Google): random `state` stored in a short-lived httpOnly cookie and verified on
  callback (CSRF protection)
- Stripe webhook: signature-verified against `STRIPE_WEBHOOK_SECRET` before any event is trusted
- No raw SQL anywhere in application code (Prisma ORM only) — no SQL injection surface
- No `dangerouslySetInnerHTML` anywhere — all user content in the UI goes through React's default
  escaping
- Transactional emails: all user-controlled strings (names, business names, AI-drafted messages) are
  HTML-escaped via a shared `escapeHtml()` before interpolation (fixed during this pass — see commit
  "Escape user-controlled names consistently in transactional emails")
- Super-admin console is gated by a separate `isSuperAdmin` flag, independent of per-business roles,
  and isn't settable through any public API (not present in the signup schema)
- Secrets (Stripe keys, OAuth client secrets, Resend/Anthropic keys) are read from env vars only,
  never sent to the client; integration credentials (Twilio auth token) are excluded from every API
  response that lists integrations

## 8. Known limitations / not yet built

Being upfront, per the build spec's instruction to never claim something works when it doesn't:

- **No automated test suite.** Verification in this build was manual/scripted smoke testing (curl
  against a live dev server) plus `tsc --noEmit`, ESLint, and a full `next build` after every task.
  A real launch needs unit tests for the money engine and agents, and integration tests for tenant
  isolation.
- **No rate limiting** on auth endpoints (login, signup, password reset) — needed before public launch
  to prevent credential stuffing / enumeration.
- **No CSRF token** beyond `sameSite=lax` cookies — acceptable for most browsers today but a
  double-submit token would be stronger defense in depth.
- **OAuth integrations (Xero, Google) are architecturally complete but untested against real
  credentials** — this sandbox has no registered OAuth apps. The connect/callback/token-exchange code
  follows each provider's documented flow, but needs a real client ID/secret to verify end-to-end.
- **Twilio/SMS sending is wired but not used anywhere in the AI Action send flow yet** — only email
  sending is connected to the "Send" button today; SMS channel selection in the UI is a follow-up.
- **No background job scheduler** in this environment. Time-based state (e.g. invoice SENT→OVERDUE) is
  recomputed lazily on read rather than via cron. Daily reports and AI agent scans are triggered
  on-demand (dashboard load / manual endpoint), not on a schedule.
- **No data export or account deletion flow** yet, despite being referenced in the Privacy page copy.
- **No referral program, NPS surface, or in-app feature-request voting UI** — the database models exist
  (`Referral`, `NPSResponse`, `FeatureRequest`) but there's no UI reading/writing them yet.
- **Free calculator tools** (Quote Follow-Up Generator, Invoice Reminder Generator, standalone ROI
  calculator) mentioned in the spec as top-of-funnel content were not built.
- Team invite emails and password-reset emails silently fall back to returning the link in the API
  response body when `RESEND_API_KEY` is unset — a deliberate dev convenience, gated to
  non-production only, but worth confirming is disabled before launch.

## 9. Configuration required before production

None of the following are required for the app to run — everything degrades gracefully — but each is
needed to turn a feature fully on:

| Env var | Enables |
|---|---|
| `DATABASE_URL` (Postgres) | Swap `PrismaBetterSqlite3` → `PrismaPg` in `src/lib/db.ts` for production |
| `AUTH_SECRET` | Replace the dev placeholder with a real `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Billing |
| `RESEND_API_KEY` | Transactional email (currently logs-only) |
| `GOOGLE_CLIENT_ID` / `SECRET` | Gmail + Calendar integration |
| `XERO_CLIENT_ID` / `SECRET` | Xero integration |
| `ANTHROPIC_API_KEY` | LLM message rewording (Ask Kiwi and agents fall back to deterministic text without it) |

## 10. Testing performed

- `npx tsc --noEmit` — clean after every task
- `npx eslint src --max-warnings=9999` — clean after every task
- `npm run build` (production build, Turbopack) — compiles cleanly, all 84+ routes generate
- Manual smoke testing via curl against a live dev server for every major flow: signup → login →
  onboarding → customer/lead/quote/invoice/job creation → AI agent run → action send/complete →
  Money Leak Scan → demo mode start → CSV import → team invite/role-change/removal → Stripe checkout
  (unconfigured-state) → Zapier webhook save → Twilio credential validation → OAuth connect fallback
  states → super-admin overview/business detail/support queue → super-admin access control (verified a
  non-admin is redirected away from `/admin`)
- XSS spot-check: created a customer named `<script>alert(1)</script> Co` and confirmed it renders as
  inert escaped text in the customer list, not an executable tag
- Tenant isolation audit: grepped every API route for the `findFirst({ id, businessId })` pattern —
  no bare `findUnique({ id })` lookups found on any tenant-owned entity

## 11. Launch checklist

1. Point `DATABASE_URL` at production Postgres, swap the driver adapter, run migrations
2. Set a real `AUTH_SECRET`
3. Configure Stripe (keys, webhook endpoint, price IDs) and test a real checkout end-to-end
4. Configure Resend and confirm transactional emails deliver (verification, reset, invites)
5. Add rate limiting to `/api/auth/*` (e.g. IP + email based)
6. Register real Xero and Google OAuth apps if those integrations are launching in v1; otherwise leave
   disabled — the UI already handles that state cleanly
7. Write at least smoke-level automated tests for the money engine and AI agents before merging further
   changes
8. Confirm the dev-only "return the reset/invite link in the API response" fallback is truly gated off
   in production (`NODE_ENV === "production"` check already in place — verify the deploy sets it)
9. Load-test the Money Leak Scan endpoint (public, unauthenticated, no rate limit yet)
10. Review and finalise Privacy/Terms copy with real data-handling practices before public launch

## 12. Recommended first 10 improvements after launch

1. Rate limiting on public/auth endpoints
2. Automated test suite (unit tests for `money-engine.ts`, `agents/*`, integration tests for tenant isolation)
3. Wire SMS as a real send channel in the AI Action Centre (the adapter exists, the UI doesn't use it yet)
4. Background job scheduler for daily reports and agent scans (currently on-demand only)
5. Data export + account/business deletion flow
6. Real OAuth app registration + end-to-end testing for Xero and Google
7. CSV import for leads/quotes/invoices (currently customers-only)
8. Referral program UI (schema exists, no screens yet)
9. NPS prompt + feature-request voting board (schema exists, no screens yet)
10. Free-tool landing pages (Quote Follow-Up Generator, Invoice Reminder Generator, ROI calculator) for top-of-funnel SEO

---

*Built across 8 commits on `claude/kiwi-job-cash-saas-a3o3bv`, from initial scaffold through
marketing site, billing, integrations, admin console, and this security/testing pass.*
