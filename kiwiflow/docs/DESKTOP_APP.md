# KiwiFlow Windows desktop app (.exe)

A real Windows installer — `KiwiFlow Setup.exe` — that installs the actual
KiwiFlow app plus its own local SQLite database, running **fully offline**
on that one PC. Its data is entirely separate from `kiwiflow.hatchable.site`
and from any browser/PWA install (see `docs/INSTALL_APP.md`) — nothing
syncs between them.

## How it's built

`desktop/` wraps the real, unmodified Next.js app (`.next/standalone`
output) in [Electron](https://www.electronjs.org/): `desktop/main.js` starts
that same server as a child process, pointed at a `kiwiflow.db` SQLite file
in this Windows user's own app-data folder, and opens it in a plain window.
`desktop/bootstrap.js` builds that database's schema from the project's real
`prisma/migrations/*/migration.sql` files the first time the app runs, and
seeds the same global Conductor rules `prisma/seed.ts` seeds everywhere
else — both read from `prisma/globalWorkflowRules.json` so the two never
drift apart. No demo accounts are created; you sign up for real, like on
the hosted site.

The installer itself is produced by `.github/workflows/build-desktop.yml`,
which runs on a real **Windows** GitHub Actions runner
(`windows-latest`) — not something built or claimed to work from a
description. The one native dependency, `better-sqlite3`, has to be
compiled specifically for Windows and for Electron's exact Node ABI (not
just "Windows Node.js" — Electron embeds its own), which is only reliable
on a real Windows machine; that's what the workflow's
`rebuild-native.js` step does, using
[`@electron/rebuild`](https://github.com/electron/rebuild).

**What's been genuinely verified without Windows:**
- `npm run build` with `output: "standalone"` succeeds and produces a
  working `.next/standalone/server.js`.
- `desktop/bootstrap.js`'s actual migration-replay + seed logic, run
  against a scratch database, produces the full real schema (36 tables)
  and the 5 correct global `WorkflowRule` rows.
- That same standalone server, started against that bootstrapped database
  with the desktop build's headers, serves a real signup through a headless
  browser end-to-end (`/signup` → dashboard → "Command Center" renders).

**What can only be verified by actually running the built .exe on Windows**
(this repo's dev sandbox has no Windows/Electron runtime to test against):
the Electron shell itself — window creation, the `ELECTRON_RUN_AS_NODE`
server-launch trick, and whether the native-module rebuild step actually
produces a loadable binary. If the workflow run is green, that's the CI
runner *compiling and packaging it successfully* — it is not the same as a
person clicking through the installed app. Please report back anything
that doesn't work.

## Getting the installer

1. On GitHub: **Actions → Build Windows desktop app → Run workflow** (this
   only runs on demand — it's a slow build, not part of every-push CI).
2. Once it finishes, open the run and download the `kiwiflow-windows-installer`
   artifact (a zip containing the `.exe`).

## Known limitations, upfront

- **Unsigned binary.** There's no code-signing certificate for this project
  (that's a paid, real-identity-verified certificate — not something that
  can be generated). Windows SmartScreen will show an "Unknown publisher"
  warning on first run. Click **More info → Run anyway** if you trust the
  build. This is a real limitation, not a bug to silently work around.
- **Separate, unsynced data.** This install's database lives only on that
  PC. It does not talk to `kiwiflow.hatchable.site`, another desktop
  install, or the PWA install — each is its own independent copy of the
  app with its own data, by design (no sync layer exists between them).
- **Optional integrations stay off.** Email, AI features, OpenWeatherMap,
  Xero/MYOB — all fail closed with no config, same as any other install of
  this repo (see `.env.example`). Nothing here builds config into the
  installer for those.
- **No auto-updater.** A new installer has to be manually re-run to update;
  it won't touch the existing database.
