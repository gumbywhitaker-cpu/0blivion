# Installing KiwiFlow on Windows

This is a normal Next.js app, not a packaged `.exe` — "installing" it means
cloning this GitHub repo and running it locally with Node.js. That gives you
the exact same app that's deployed, running on your own machine with its own
local database. This guide gets a fresh Windows PC there in about 10 minutes.

There are two ways to do it: the **automated script** (recommended — handles
everything below for you), or the **manual steps** if you'd rather see and
run each command yourself, or the script hits something on your machine it
doesn't handle.

## Before you start

You need two things installed. If you're not sure whether you already have
them, open **PowerShell** (search "PowerShell" in the Start menu) and run:

```powershell
git --version
node --version
```

If either command says it isn't recognized, install the missing one:

- **Git for Windows** — [git-scm.com/download/win](https://git-scm.com/download/win).
  Run the installer with the default options.
- **Node.js** (LTS version) — [nodejs.org](https://nodejs.org). Download the
  "LTS" installer, not "Current". Run it with the default options — this
  also installs `npm`, which you'll need.

Close and reopen PowerShell after installing either one, so it picks up the
new commands. Re-run the two `--version` commands above to confirm both work
before moving on.

## Option A — automated script (recommended)

Open PowerShell, go to the folder where you want the project to live, and
run:

```powershell
git clone https://github.com/gumbywhitaker-cpu/0blivion.git
cd 0blivion\kiwiflow
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\windows-setup.ps1
```

That `Set-ExecutionPolicy` line is a one-time, this-window-only permission —
Windows blocks running `.ps1` scripts by default, and this line allows it
just for the PowerShell window you're currently using, without changing any
system-wide setting.

The script will:

1. Check that Git and Node.js are actually installed (and tell you exactly
   what's missing if not).
2. Run `npm install` to pull down the app's dependencies.
3. Create your local `.env` file from `.env.example` and generate a random
   `AUTH_SECRET` for you automatically — you don't need to come up with one
   yourself.
4. Set up the local database (SQLite — a single file, no separate database
   server to install) and load it with realistic demo data: sample growers,
   contractors, jobs, and the two demo logins below.
5. Print the demo logins and start the app.

When it finishes, open **http://localhost:3000** in your browser.

## Option B — manual steps

If you'd rather run each step yourself:

```powershell
git clone https://github.com/gumbywhitaker-cpu/0blivion.git
cd 0blivion\kiwiflow
npm install
copy .env.example .env
```

Open the new `.env` file in Notepad (`notepad .env`) and replace the
`AUTH_SECRET` placeholder with any long random string — for example, run
this in PowerShell and paste the result in:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

Then set up the database and start the app:

```powershell
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open **http://localhost:3000**.

## Logging in

The seed script creates two demo accounts so you have something to click
around immediately:

| Role       | Email                                 | Password    |
|------------|----------------------------------------|-------------|
| Grower     | `hana@whakatane-orchards.example`       | `kiwiflow123` |
| Contractor | `wiremu@southernharvest.example`        | `kiwiflow123` |

You can also sign up your own account from the app's home page — self-serve
signup is enabled for Grower/Contractor/Packhouse/Transport org types.

## Everyday use after the first install

You only run the install steps once. After that, to start the app again:

```powershell
cd 0blivion\kiwiflow
npm run dev
```

To pull down changes from GitHub later:

```powershell
git pull
npm install
npx prisma migrate dev
```

(`npm install` and `prisma migrate dev` are safe to run every time — they're
no-ops if there's nothing new to install or migrate.)

## Troubleshooting

**"running scripts is disabled on this system"** — PowerShell's default
security policy blocks `.ps1` files. Use the `Set-ExecutionPolicy` line
under Option A above; it only affects your current PowerShell window, not
the whole machine.

**`npm install` fails building `better-sqlite3`** — this package ships
pre-built binaries for common Node/Windows combinations, so this is rare.
If it happens, it's almost always a Node version mismatch: check
`node --version` is an LTS release (even major version, e.g. 20.x or 22.x),
not an odd-numbered "Current" release, and re-run `npm install`. If it still
fails, install the "Desktop development with C++" workload from
[Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
so npm can compile it from source instead, then re-run `npm install`.

**Port 3000 is already in use** — something else on your PC is using it
(often another `npm run dev` left running in a different window). Either
close that, or run `npm run dev -- -p 3001` and open
`http://localhost:3001` instead.

**Nothing loads / blank page** — check the PowerShell window running
`npm run dev` for an error. The most common cause is a missing or malformed
`.env` file; compare yours against `.env.example`.

## What "installing on Windows" does *not* mean here

To be upfront about scope: this repo does not (yet) produce a standalone
Windows `.exe`/`.msi` installer, a system tray app, or an auto-updater —
that would need a separate desktop-packaging build (e.g. Electron or Tauri)
with real code-signing, which is a materially different project from the
web app this repo builds. What you get by following this guide is the same
Next.js app running locally, which is the standard, honest way to "install"
an open-source web app from its GitHub repo.
