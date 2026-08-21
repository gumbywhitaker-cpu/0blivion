# KiwiFlow

The operational layer for the New Zealand kiwifruit sector — growers, contractors,
crews, transport and pack houses working off one shared record instead of duplicated
paperwork.

Read [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) first — it's the architecture behind this
code, including what's deliberately deferred and why.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma 7 ·
SQLite locally / Postgres-ready in production.

## Getting started

```bash
npm install
cp .env.example .env        # then set a real AUTH_SECRET
npx prisma migrate dev      # creates dev.db and applies the schema
npm run db:seed             # global Conductor rule + demo grower/contractor/jobs
npm run dev
```

Demo logins after seeding (see `prisma/seed.ts`):

- Grower: `hana@whakatane-orchards.example` / `kiwiflow123`
- Contractor: `wiremu@southernharvest.example` / `kiwiflow123`

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — ESLint
- `npm run db:seed` — re-run the seed script (idempotent; safe to run repeatedly)

## Project layout

- `app/(auth)` — signup/login/logout
- `app/(app)` — the authenticated product: Command Center, Contractor Hub, jobs,
  orchards, contractors, crews, invoices, notifications
- `app/onboard/[token]` — public OneTap contractor onboarding (QR-driven)
- `app/api/v1/export` — CSV export endpoints
- `lib/conductor` — the event bus + rule engine ("the Conductor")
- `lib/auth` — session, password hashing, role checks
- `prisma/schema.prisma` — the data model
