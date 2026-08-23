# Installing KiwiFlow as an app (Windows, macOS, Android, iOS)

KiwiFlow is a Progressive Web App (PWA). That means you can install it
straight from the browser, on any of these platforms, with **no app store,
no code signing, and nothing to download and run** — you just visit the site
and click "Install". It then opens in its own window/icon like a native app,
separate from your browser tabs.

This is a genuinely different thing from
[`WINDOWS_INSTALL.md`](WINDOWS_INSTALL.md), which is about running this
repo's *source code* locally as a developer. This guide is about installing
the *already-running app* as a normal app icon — the one thing here that's
actually the same steps on every platform.

Live app: **https://kiwiflow.hatchable.site**
(A locally-run copy from `WINDOWS_INSTALL.md`, e.g. `http://localhost:3000`,
is installable the exact same way.)

## Windows (Chrome or Edge)

1. Open the site in Chrome or Edge.
2. Click the **install icon** in the address bar (a small monitor-with-arrow
   icon, right side of the address bar) — or open the **⋮** menu and choose
   **Install KiwiFlow…** / **Apps → Install this site as an app**.
3. Confirm. KiwiFlow now has its own Start Menu entry and taskbar icon, and
   opens in its own window.

## macOS

**Chrome or Edge:** same as Windows above — install icon in the address bar,
or **⋮ menu → Install KiwiFlow…**. It's added to Launchpad like any other app.

**Safari (17+):** open the site, then **File → Add to Dock…** (or the Share
icon → **Add to Dock**). Older Safari versions don't support this — use
Chrome or Edge instead.

## Android

Open the site in Chrome. You'll usually see an **"Add KiwiFlow to Home
screen"** banner automatically; if not, open the **⋮** menu and choose
**Add to Home screen** / **Install app**. It installs like any Play Store
app — its own icon, its own entry in the app drawer.

## iPhone / iPad (Safari)

iOS doesn't allow any browser to trigger an install prompt automatically —
Apple requires this to be a manual step, for any web app, from any site.

1. Open the site in **Safari** (this doesn't work from Chrome or another
   browser on iOS — they're all required to use Safari's engine, but only
   Safari itself exposes this option).
2. Tap the **Share** icon (square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

KiwiFlow now has a home screen icon and opens full-screen, without Safari's
address bar.

## Why not a "real" installer / app store app instead?

Worth being direct about this rather than implying otherwise:

- **This is a real install**, not a shortcut — once installed, it has its
  own icon, its own window, and (per `public/sw.js`) works with cached pages
  for the Contractor Hub even with no signal. That's a standard, fully
  supported way to distribute a web app; it's how Anthropic's own Claude
  app, Google Docs, and most banking apps behave when "installed" on
  desktop/mobile now.
- A native `.exe`/`.msi`, Android `.apk`, or iOS App Store listing is a
  materially different, much larger project: desktop packaging (e.g.
  Electron/Tauri) with real code-signing certificates, a signed Android
  release build, and — for iOS specifically — an Apple Developer account
  ($99/year) plus App Store review, none of which exist for this project.
  If real native distribution is wanted later, that's a separate scoped
  piece of work, not something this guide should overclaim.
