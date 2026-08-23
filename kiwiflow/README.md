# KiwiFlow

The operational layer for the New Zealand kiwifruit sector — growers, contractors,
crews, transport and pack houses working off one shared record instead of duplicated
paperwork.

Read [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) first — it's the architecture behind this
code, including what's deliberately deferred and why.

## Install the app (Windows, macOS, Android, iOS)

The live app installs straight from the browser — no app store, nothing to
download and run — at **https://kiwiflow.hatchable.site**. Open it, then:

- **Windows / macOS (Chrome or Edge)** — click the install icon in the
  address bar, or **⋮ menu → Install KiwiFlow…**
- **Android (Chrome)** — **⋮ menu → Add to Home screen / Install app**
- **iPhone/iPad (Safari)** — Share icon → **Add to Home Screen**

Full step-by-step per platform: [`docs/INSTALL_APP.md`](docs/INSTALL_APP.md).

That's a real install (own icon, own window, works offline for the field
pages) via the web-app-install standard every OS above supports — it is
*not* a native `.exe`/`.apk`/App Store app, and `docs/INSTALL_APP.md`
explains why that's a materially different (and much larger) project.

**Want an actual Windows `.exe` instead?** One exists: `docs/DESKTOP_APP.md`
— a real installer with its own fully offline local database, built by a
genuine Windows CI machine (not something claimed to work without being
built). Read that page first — it's upfront about what is and isn't
verified, and about the real limitations (unsigned binary, no data sync
with the hosted site).

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma 7 ·
SQLite locally / Postgres-ready in production.

## Getting started

**On Windows?** See [`docs/WINDOWS_INSTALL.md`](docs/WINDOWS_INSTALL.md) for a
step-by-step guide (including a script that does the below for you). The
short version, from PowerShell:

```powershell
git clone https://github.com/gumbywhitaker-cpu/0blivion.git
cd 0blivion\kiwiflow
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\windows-setup.ps1
```

On macOS/Linux, or to run the steps yourself on any platform:

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
