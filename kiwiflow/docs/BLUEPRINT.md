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
11. CSV export (jobs, invoices)
12. Conductor automation engine (event bus + rule engine, one shipped rule)

Explicitly deferred: Logistics Bridge, Materials Ordering, mass broadcasting, AI layer,
regional heat maps, Zespri oversight engine, offline sync, MFA, rate limiting, Postgres
RLS, SMS/email/push provider wiring, PDF generation via headless browser (CSV + print-
to-PDF ships instead — see Section 9).

## 16. Testing / Deployment / Scaling (brief, honest)

Testing: none automated in this session — flagged as a gap, not glossed over. First
addition should be integration tests around the Conductor (`emitEvent` → correct
`Invoice`/`Notification` rows), since that's the highest-blast-radius code path.
Deployment target: any Node-hosting platform (Vercel, Railway, Fly.io) with a managed
Postgres instance; local dev uses SQLite via the same Prisma schema (provider swap is
one line in `schema.prisma` + env var). Scaling: stateless app tier behind the DB from
day one; first real bottleneck at scale will be the Conductor running synchronously —
that's the trigger to move it to a queue, not before.
