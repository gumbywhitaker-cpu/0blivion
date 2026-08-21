# KiwiFlow — Master Technical Blueprint

Status: living document. This is the architecture behind the code in this repo, not a
pitch deck. Every claim below maps to something that either exists in `/kiwiflow` today
or is explicitly marked as future work. Nothing in here should describe a feature as
"integrated" when it is actually a stub.

---

## 0. Read this first: where I pushed back on the spec

Instruction #39 in the brief said not to just agree. Here's what I changed and why.

1. **"Recovered Revenue Live Tally" as originally specified is a vanity metric with no
   defined methodology.** "Money identified, recovered, prevented from being lost, or
   otherwise captured" is four different calculations wearing one number. A grower who
   sees a big green figure and then can't explain it to their accountant will stop
   trusting the product within a week — this is the fastest way to torch credibility
   with an audience that already distrusts software vendors. I split it into two
   **auditable** figures instead:
   - **Invoiced Revenue (period)** — sum of `Invoice.total` where `status IN (SENT, PAID)`,
     directly traceable to line items and jobs. This ships in the MVP.
   - **Waiting-Time Cost Avoided** — `(baseline waiting minutes − actual waiting minutes) ×
     cost-per-hour rate`, only computed once the Logistics Bridge exists to measure actual
     waiting time (post-MVP). Until that module exists, the dashboard shows **"Not yet
     tracked"**, not a fabricated number.
   Every dollar shown must be click-through-able to the invoice or job that produced it.

2. **The Zespri Global Oversight Engine is out of scope for a first build, and the spec
   says as much itself ("do not assume or fabricate access to Zespri's private
   systems").** Building map heat-maps against data you don't have access to is a
   demo, not a product. I've designed the `IndustryDataSource` adapter interface
   (Section 10) so this can be wired up later against a real, authorised feed, and
   stopped there.

3. **SMS is expensive and easy to over-use in a "notify everyone" system.** The spec
   asks for SMS "where appropriate." I've made notification channel a property of
   `urgency` (CRITICAL → push + SMS + email; URGENT → push + email; NORMAL → in-app +
   push) rather than a blanket broadcast channel, and built the adapter so SMS is the
   one channel requiring an explicit provider key — it fails closed, not open, if
   unconfigured. Cost control by default beats an unconfigured account backing into a
   $4,000 Twilio bill in month one.

4. **A single relational schema per tenant, not a schema-per-tenant or database-per-
   tenant multi-tenancy model.** The spec asks for strict tenant isolation. Physical
   isolation (separate DBs) is the safest but is operationally expensive for what is
   explicitly meant to be affordable for small contractors. I used **row-level tenant
   scoping** (`organizationId` on every table + a query-layer guard that refuses to run
   without a tenant filter) as the MVP posture, with a documented upgrade path to
   Postgres RLS policies before any GA launch. This is called out explicitly in
   Section 11 as a known gap, not hidden.

5. **"AI must never invent operational facts" is right, and it constrains the AI
   layer's architecture more than the spec's AI section implies.** An LLM answering
   "what's holding up Bay of Plenty jobs today" has to be grounded in a tool-call
   against the real `Job`/`Notification`/`Event` tables, permission-filtered by the
   asking user's org, with the answer text generated only from the returned rows. I've
   designed this as function-calling over the same API the UI uses (Section 15) — no
   separate "AI data path" that could drift from what's actually true. Not built in
   the MVP; the interface is documented so it slots in without a schema change.

6. **The MVP list in the spec (13 items) is achievable but the ordering is wrong for a
   contractor-first product.** Authentication → org setup → OneTap → customer DB → job
   scheduling → Contractor Hub is correct, but I moved **basic invoicing before
   materials/logistics** stays as specified — that part was right. What I changed:
   Conductor automation is not a separate phase 13, it is the plumbing under phases
   6–10 (job completion, invoicing, notifications) from day one, because retrofitting
   an event bus under a hand-wired app is a rewrite, not a refactor. See Section 6.

7. **QR generation does not need a paid external API.** The spec calls for "a QR-code
   generation API" as an integration; QR codes are generated locally and deterministically
   from a token — there is no reason to take a network dependency (or a vendor bill) for
   this. Built with the `qrcode` npm package server-side.

---

## 1. Executive Architecture

KiwiFlow is a multi-tenant web application. One codebase, one database, tenant data
scoped by `organizationId`. Organizations have a `type` (GROWER, CONTRACTOR, TRANSPORT,
PACKHOUSE, ACCOUNTANT, ADMIN) and relate to each other through explicit link tables
(`ContractorLink` today; `TransportLink`/`PackhouseLink` follow the same pattern when
Logistics Bridge ships) rather than a free-for-all shared namespace.

```
                        ┌─────────────────────────────┐
                        │        Next.js App           │
                        │  (App Router, Server Actions) │
                        │                               │
   Browser / PWA  ───▶  │  UI (role-scoped dashboards)  │
   (mobile-first)       │  API routes (/api/v1/*)       │
                        │  Auth (session cookie, JWT)   │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────┐
                        │        Conductor              │
                        │  emitEvent() → Event row      │
                        │  → match WorkflowRule         │
                        │  → run actions (in-process)   │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────┐
                        │   Prisma ORM → PostgreSQL      │
                        │   (SQLite locally for dev)     │
                        └─────────────────────────────┘
```

The Conductor runs **in-process and synchronously** for the MVP — an emitted event's
rule actions execute in the same request before the response returns. This is a
deliberate simplification: a queue (e.g. a Postgres-backed job table polled by a worker,
upgrading later to SQS/BullMQ) is the correct answer once event volume or action latency
(e.g. calling a real SMS provider) makes synchronous execution too slow. Don't build the
queue before there's a queue-shaped problem.

## 2. System Diagram — User Roles

| Role | Home surface | Primary question answered |
|---|---|---|
| Grower Owner/Manager | Grower Command Center | "What is happening with my operation?" |
| Contractor Owner/Manager | Contractor Hub | "What do I need to do today, and who's doing it?" |
| Crew Member | Contractor Hub (restricted) | "Where do we go and what do we do?" |
| Driver | Logistics Bridge (post-MVP) | "Where am I going and what happens next?" |
| Pack House | Logistics Bridge (post-MVP) | "What's arriving and when?" |
| Accountant | Export / Invoices (read-only) | "What financial information do I need?" |
| Admin (KiwiFlow ops) | Admin console | "Is the system healthy?" |

## 3. Permission Model

- **Tenant isolation**: every row that isn't global reference data carries
  `organizationId`. All Prisma queries go through `withOrgScope(orgId, ...)` helpers in
  `lib/db/scope.ts` — there is intentionally no raw `prisma.job.findMany()` call in
  route handlers without a scope helper, enforced by code review discipline now and a
  lint rule before GA.
- **Role within org**: `User.role` ∈ `OWNER, MANAGER, FIELD, DRIVER, VIEWER`. Role gates
  UI affordances and mutation endpoints (`lib/auth/requireRole.ts`).
  Read paths are scoped by org; only mutation paths additionally check role, since a
  VIEWER on FIELD-only jobs never needs a role check to *see* their own org's data.
- **Cross-org visibility** only happens through an explicit link row
  (`ContractorLink.status = ACTIVE`) and even then only for the job/orchard fields
  needed to do the job — a contractor sees the orchard address and job instructions,
  not the grower's invoice history with other contractors.

## 4. Database Architecture

See `prisma/schema.prisma` for the authoritative schema. Summary of MVP entities:

`Organization, User, Session, Orchard, ContractorLink, Crew, CrewMember, Job,
JobStatusHistory, Invoice, InvoiceItem, Notification, Event, WorkflowRule,
OnboardingInvite, Document, AuditLog`

Design notes:
- `Job.status` is a Prisma enum, not a free string, so the Conductor can pattern-match
  on it exhaustively.
- Every status transition writes a `JobStatusHistory` row — this is the audit trail
  the Conductor and the accountant export both read from, so it exists from day one
  rather than being bolted on later.
- `Invoice` and `InvoiceItem` are separate from `Job` — a job can (eventually) produce
  multiple invoice line items (e.g. partial billing), and an invoice can reference
  multiple jobs, even though the MVP only wires the 1:1 case.
- `Event` is an append-only outbox: `{ id, organizationId, type, payload (JSON),
  createdAt, processedAt }`. `processedAt` being null is how a future queue worker
  would pick up unprocessed events if we move off synchronous execution.
- GST is stored as a rate snapshot on the invoice (`gstRate`), not hardcoded 15%, so a
  future rate change doesn't corrupt historical invoices.

## 5. Event Architecture

`lib/conductor/events.ts` defines the event catalog as a TypeScript discriminated
union, so a typo'd event name is a compile error, not a silent no-op:

```
JOB_CREATED, JOB_STATUS_CHANGED, JOB_COMPLETED,
CONTRACTOR_ONBOARDED, INVOICE_CREATED, INVOICE_SENT,
```

Post-MVP additions (`DRIVER_WAITING`, `MATERIAL_ORDERED`, `PAYMENT_RECEIVED`, ...) slot
into the same union without touching existing rule definitions.

## 6. Conductor Architecture

`lib/conductor/emit.ts::emitEvent(orgId, event)`:
1. Writes the `Event` row.
2. Loads enabled `WorkflowRule`s where `eventType` matches (global rules with
   `organizationId = null`, plus any org-specific overrides).
3. Runs each rule's `actions` array against a fixed, typed action registry
   (`lib/conductor/actions.ts`): `notify`, `createInvoiceDraft`, `updateJobStatus`. No
   `eval`, no dynamic code execution from stored rule data — actions are looked up by a
   string key against a compiled TypeScript map. This is the difference between a
   configurable rule engine and an arbitrary-code-execution vulnerability.
4. Marks the event `processedAt`.

Shipped MVP rule: **JOB_COMPLETED → createInvoiceDraft + notify(grower owner, NORMAL)**.
This is the concrete version of the spec's Section 17 example, minus the steps that
depend on modules not yet built (accounting export prep happens in Section 9's CSV
export instead of as a Conductor side effect, since it's pull, not push).

## 7. API Architecture

`/api/v1/*` REST routes backed by Next.js route handlers, versioned from the first
commit per the spec's instruction. Mutations also available as Server Actions for
same-origin form submissions (faster for mobile, no client-side fetch boilerplate).
Every handler: (1) resolves session, (2) resolves org scope, (3) validates input with
`zod`, (4) performs the operation, (5) emits Conductor events where relevant.

## 8. Security Architecture

- Passwords: `bcryptjs`, cost factor 12.
- Sessions: signed JWT (`jose`) in an `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookie.
  No client-readable tokens.
- Input validation: `zod` schemas colocated with each route handler.
- Audit log: mutating actions on `Job`, `Invoice`, and `Organization` write an
  `AuditLog` row (`actorId, action, entityType, entityId, before/after` where cheap to
  capture).
- Rate limiting and MFA are **not implemented in the MVP** — flagged here rather than
  silently absent. Both are straightforward additions (`upstash/ratelimit` +
  TOTP via `otplib`) before any production tenant with real financial data goes live.

## 9. Mobile / Reporting

Mobile-first Tailwind layouts, large touch targets, bottom-anchored primary actions on
the Contractor Hub. Offline-first sync queue is **not built in the MVP** — flagged as
Phase 2, because building a reliable offline queue before there is a stable API surface
to sync against is wasted work that will be rebuilt anyway.

CSV export: `/api/v1/export/jobs.csv`, `/api/v1/export/invoices.csv` — streamed, org-
scoped, accountant-readable column headers (not internal field names).

## 10. Integration Architecture

Adapters live in `lib/integrations/`, each behind an interface so a provider swap is a
config change, not a rewrite:
- `QrProvider` → local (`qrcode` pkg). No external dependency needed.
- `NotificationChannel` → `InAppChannel` (built), `EmailChannel` / `SmsChannel` /
  `PushChannel` (interfaces defined, providers unconfigured — see Section 13).
- `IndustryDataSource` → interface only, no implementation. This is where a future,
  authorised Zespri or MPI feed would plug in (Section 0.2).
- `StorageProvider` → local filesystem for MVP `Document` uploads; interface matches
  what an S3-compatible swap needs.

## 11. Data Privacy / Tenant Isolation (honest state)

Implemented: row-level `organizationId` scoping via query helpers, role checks on
mutations, audit log on financial/job mutations.
Not yet implemented, explicitly required before handling real commercial data at scale:
Postgres Row-Level Security policies as defense-in-depth (currently the app layer is
the *only* enforcement point — a bug in a route handler is a tenant-isolation bug, full
stop), field-level encryption for anything beyond password hashes, and a formal data
export/delete flow for privacy requests.

## 12. Notification Architecture

`Notification { urgency: NORMAL | URGENT | CRITICAL }` drives channel fan-out
(Section 0.3). MVP ships **in-app only** (bell icon, unread count, mark-read). Channel
adapters are wired but no provider credentials are configured — sending silently
no-ops with a console warning rather than throwing, so a missing SMS key doesn't take
down job completion.

## 13. AI Layer (not built, interface reserved)

Deferred entirely. When built: a tool-calling loop where the model can only call the
same permission-checked query functions the UI uses, and the final answer is generated
strictly from returned rows — never from the model's own knowledge of "typical" kiwifruit
operations. This is a hard requirement given the spec's "AI must never invent
operational facts," not a nice-to-have.

## 14. Monetisation (design only, not implemented)

Grower: per-orchard-hectare tier. Contractor: flat low monthly fee (the spec is right
that this segment churns immediately if priced like enterprise software). Transport:
per-vehicle. No transaction-based revenue in v1 — payment processing is a second
product decision, not a v1 requirement, and bundling it in prematurely creates PCI
scope this document is not going to hand-wave past.

## 15. MVP Definition (what's actually in `/kiwiflow` after this session)

1. Auth (email + password, session cookie, org + role)
2. Organization setup (create org during signup)
3. OneTap onboarding with local QR generation
4. Customer database: orchards, contractor links, crews, crew members
5. Job scheduling with full status lifecycle
6. Contractor Hub (today/upcoming jobs, accept, start, complete with quantity)
7. Grower Command Center (job overview, invoiced-revenue tally, notifications)
8. In-app notifications
9. Job completion → Conductor → invoice draft (automatic)
10. Basic invoicing (list, detail, printable view, GST)
11. CSV export (jobs, invoices, spray diary, maturity tests, material orders)
12. Conductor automation engine (event bus + rule engine, shipped rules for
    auto-invoicing, coolstore alerts, and material order status notifications)
13. Materials Ordering — the 4th data pillar (Section 22)
14. Live weather (Open-Meteo) on the Grower Command Center, with a spray-window
    indicator — real API data, fails closed to "unavailable" rather than fabricating
    numbers if the call fails (Section 0 constraint applied here too)
15. Platform Admin — read-only cross-org role (Section 23)
16. Login rate limiting (Section 24)

Explicitly deferred: Logistics Bridge, mass broadcasting, AI layer, regional heat
maps, Zespri oversight engine, offline sync, MFA, Postgres RLS, SMS/email/push
provider wiring, PDF generation via headless browser (CSV + print-to-PDF ships
instead — see Section 9).

## 16. Testing / Deployment / Scaling (brief, honest)

Testing: none automated in this session — flagged as a gap, not glossed over. First
addition should be integration tests around the Conductor (`emitEvent` → correct
`Invoice`/`Notification` rows), since that's the highest-blast-radius code path.
Deployment target: any Node-hosting platform (Vercel, Railway, Fly.io) with a managed
Postgres instance; local dev uses SQLite via the same Prisma schema (provider swap is
one line in `schema.prisma` + env var). Scaling: stateless app tier behind the DB from
day one; first real bottleneck at scale will be the Conductor running synchronously —
that's the trigger to move it to a queue, not before.

## 20. Tax invoice compliance (Taxable Supply Information)

New Zealand replaced the "tax invoice" rule with broader "taxable supply information"
(TSI) requirements on 1 April 2023 — a supplier GST number is required for records
over $200, and the buyer needs one identifying detail (address/phone/email/trading
name/NZBN/URL) for records over $1,000 (IRD, via search-result summary of IRD-derived
guidance — see Section 21 for the research-provenance caveat that applies here too).
`Organization` now carries `gstNumber`/`address`/`phone`, editable at `/settings`. The
invoice page shows both orgs' GST number/address and warns the issuer inline if their
GST number is missing on an invoice over $200, rather than silently producing a
document that wouldn't hold up as a GST record.

## 21. Paperless industry records — what's digitized, what isn't, and where the
    numbers came from

The brief asked to find and digitize the paperwork the NZ kiwifruit industry actually
uses, including Brix/maturity testing and pack house temperature control, researched
rather than guessed. Here's what that turned into, and — as important — what it didn't.

**Researched and implemented**, sourced from the public documents cited below (WebSearch
results captured in this session; no scraped PDF content was available — the two
primary-source PDFs, NZKGI's grower handbook chapter and Zespri's contractor
agrichemical checklist, sit behind a domain the sandbox's egress proxy blocks, so the
figures below come from search-result summaries of those documents, not a direct read
— treat the specific numbers as a well-sourced starting point to verify against the
current-season Zespri Harvest Standard before relying on them commercially, not as a
guarantee):

- **Harvest maturity testing** (`HarvestMaturityTest`): records Brix (soluble solids,
  °Brix) and dry matter % per test, checked against a **reference** minimum threshold
  per variety (Hayward ≈15.5% DM / ≥6.2°Brix, Gold3 ≈16.1% DM / ≥8.0°Brix — NZKGI grower
  handbook Chapter 6, via search-result summary). Zespri sets and revises the actual
  clearance thresholds each season through its own Harvest Standard; KiwiFlow has no
  live feed to that document. Every test **snapshots** the threshold it was actually
  checked against (`minBrixRequired`/`minDryMatterRequired` columns) precisely so a
  past record stays accurate even after next season's numbers change — the reference
  constants in `lib/types.ts` are a sensible default, not an authority, and are called
  out as such in the UI.
- **Spray diary / crop protection record** (`SprayDiaryEntry`): product, active
  ingredient, HSR number (for highly ecotoxic compounds), rate, area treated, target,
  weather, application date, withholding period, and a computed harvest-safe date —
  the field set the Zespri Spray Diary and NZS 8409:2021 (Management of Agrichemicals)
  are described as requiring, applications logged within 7 days, records retained 3
  years. CSV export exists specifically so this can be handed to an auditor or
  regional council without asking them to learn KiwiFlow.
- **Coolstore temperature log** (`CoolstoreTemperatureLog`): manual reading entry
  against a reference safe range (-1°C to +1°C, ~90-95% RH is the commonly cited
  storage range for kiwifruit) with a Conductor rule (`COOLSTORE_TEMP_ALERT` →
  `notifyCoolstoreAlert`, CRITICAL urgency) firing the moment a reading falls outside
  it — the concrete version of the spec's "waiting-time engine" exception pattern,
  built against something KiwiFlow can actually verify instead of a fabricated
  number. **No device integration**: readings are typed in. A real coolstore would
  have logging hardware; that's an `IntegrationAdapter` for a later phase, not invented
  here.
- **Tax invoice compliance** (`Organization.gstNumber/address/phone`, invoice page):
  New Zealand replaced the "tax invoice" rule with broader "taxable supply
  information" requirements on 1 April 2023 — a GST number is required for records
  over $200, and the buyer needs one identifying detail (address/phone/email/trading
  name/NZBN/URL) for records over $1,000 (IRD, via search-result summary of
  IRD-derived guidance). The invoice page now shows both orgs' GST number/address and
  warns the issuer inline if their GST number is missing on an invoice over $200,
  rather than silently producing a document that wouldn't hold up as a GST record.

**Explicitly not attempted**, so this isn't oversold as "the industry's paperwork,
digitized": NZGAP and GLOBALG.A.P certification audit checklists (these are structured,
versioned audit instruments tied to a certification body, not a form KiwiFlow can
safely reproduce without that body's involvement), KVH Psa surveillance/biosecurity
declaration forms, MPI phytosanitary export certificates, and the full Zespri Orchard
Gate Price statement (grower payment structure spans fruit loss, post-harvest costs,
Class 2 income, pool rates, and loyalty/share mechanics that are Zespri's own
calculation, not KiwiFlow's to restate). Each is a legitimate future scope item; none
of them were guessed at here.

## 22. Materials Ordering (4th data pillar)

`Supplier` / `MaterialOrder` / `MaterialOrderItem`, following the same status-lifecycle
pattern as `Job` (`DRAFT → SUBMITTED → CONFIRMED → DELIVERED`, plus `CANCELLED` from any
pre-`DELIVERED` state), wired into the Conductor exactly like job completion: each
transition emits an event and a seeded global `WorkflowRule` notifies the ordering org's
owners.

One deliberate design choice worth calling out: **this does not reuse the `Invoice`
model**, even though both are "money owed" records. An `Invoice` bills between two
KiwiFlow organizations (`fromOrg`/`toOrg`, both tenants with their own users and
sessions); a `Supplier` is an external business with no KiwiFlow account at all — there
is no second party to bill, confirm, or notify inside the platform. Forcing suppliers
into the `Organization` model to reuse `Invoice` would have meant fabricating accounts
for businesses that never signed up, so `Supplier` stays a plain per-org contact record
instead.

**Honest scope note**: `CONFIRMED` and `DELIVERED` are marked by the ordering org's own
staff (e.g. after a phone call or when the truck arrives), not verified against any real
supplier system — there is no supplier-side API to confirm against, and none is claimed.
This mirrors the coolstore log's "no device integration" note in Section 21: a real
supplier-EDI or ordering-portal integration is a legitimate future `IntegrationAdapter`,
not something invented here.

**On "everything perfect, nothing missed"**: that standard isn't achievable honestly
for a domain this broad in one pass, and claiming it would be the same mistake as the
original "Recovered Revenue" metric — a number that looks authoritative and isn't. What
above is real: sourced, cited, snapshotted for audit trail, and clearly marked where
it's a configurable default rather than a live regulatory feed.

## 23. Platform Admin (cross-org role)

Requested directly, not part of the original spec: a single account with visibility
across every organization on the platform. This is a deliberate exception to the
tenant-isolation model in Section 0.4/11 — every other role's queries are scoped to
`session.organizationId`; `ADMIN` is the one org type that isn't.

**What shipped**: `ADMIN` as a fifth org type (`lib/types.ts`), a read-only
`/admin` overview page (`app/(app)/admin/page.tsx`) listing every organization with
aggregate counts (users, orchards, jobs by status, invoices), and `isAdmin`/`assertIsAdmin`
guards in `lib/auth/requireRole.ts`. `ADMIN` accounts are created only via
`scripts/create-admin.ts`, run directly against the database with a generated
high-entropy password (192 bits, printed once) — never through the public signup flow.

**A real vulnerability found and fixed while building this**: the signup Server Action
(`app/(auth)/actions.ts`) validated `orgType` against the full `ORG_TYPES` enum, while
the signup UI only offered a restricted subset. Since Server Actions are directly
callable independent of what the UI renders, a crafted request with `orgType: "ADMIN"`
would have created a real ADMIN organization — a privilege-escalation path that existed
before this feature and was only surfaced by building it. Fixed by introducing
`SELF_SERVE_ORG_TYPES` (excludes `ADMIN`) and validating signup against that list
instead; the UI now derives its dropdown from the same constant so the two can't drift
apart again. Verified via Playwright: the signup dropdown never offers `ADMIN`, and a
crafted `orgType=ADMIN` field injected directly into the form's DOM and submitted does
not produce an ADMIN organization.

**Deliberately narrow scope, and why**: this ships as read-only overview data, not a
parallel admin UI for every existing feature (no cross-org job/invoice editing, no
user management, no impersonation). Building that surface is a much larger scope than
"a login with full access," and a wider blast-radius one — every additional admin
mutation is another cross-tenant code path to get right. Ship the narrow, correct
version now; widen deliberately if there's a concrete need, not by default.

**Known gap, stated plainly**: there is no MFA on this build (still listed as deferred
in Section 15), which matters more for this account than any other — it's the single
highest-value credential in the system. Login rate limiting (the other gap noted here
originally) has since shipped — see Section 24 — closing the specific brute-force risk
that made this account worth calling out in the first place. MFA remains open.

## 24. Login rate limiting

A `LoginAttempt` table (`email`, `succeeded`, `createdAt`) backs a fail-closed lockout:
5 failed attempts for one email within 15 minutes blocks further attempts for that
email — including one with the *correct* password, verified by test — until the
window rolls off. `lib/auth/rateLimit.ts` has the full implementation.

**Deliberately per-email, not per-IP**: this MVP has no reliable client IP source
without adding proxy-trust configuration, and per-IP limiting would let a shared
office or NAT lock everyone behind it out together. Locking on email directly
protects the thing that matters — one specific account being brute-forced — at the
cost of letting an attacker who already knows a real email temporarily deny that
one user's own logins. Given account discovery already requires knowing someone's
email, that's the right trade-off for this build.

**Deliberately DB-backed, not a distributed cache**: this is a single-instance MVP
(Section 16), so a Postgres/SQLite table is the honest way to close this gap without
introducing new infrastructure (Redis, etc.) an app this size doesn't otherwise need.
Revisit if the app ever runs as multiple instances behind a load balancer, where a
shared cache would be the correct mechanism instead of N separate lockout counters.

Scope note: this covers login only, not signup. Signup-flood / fake-account-creation
protection is a related but separate gap and remains deferred (Section 15).
