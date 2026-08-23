// better-sqlite3 is a native addon. The copy build.js just copied into
// resources/app-standalone/node_modules was compiled during `npm run build`
// against the CI runner's plain system Node.js — but main.js runs the
// server under Electron's own embedded Node (ELECTRON_RUN_AS_NODE=1), which
// has a different ABI. This rebuilds that one module, in place, against the
// exact Electron version this app ships, so the binary actually matches the
// runtime that will load it. Must run on the same OS/arch being packaged
// (Windows) — that's why this is a CI step on a windows-latest runner, not
// something done on a developer's own machine of a different OS.
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const electronVersion = require("electron/package.json").version;
const moduleDir = path.join(__dirname, "resources", "app-standalone", "node_modules");
const rebuildBin = path.join(__dirname, "node_modules", ".bin", process.platform === "win32" ? "electron-rebuild.cmd" : "electron-rebuild");

console.log(`Rebuilding better-sqlite3 for Electron ${electronVersion} in ${moduleDir}`);
execFileSync(
  rebuildBin,
  ["--force", "--which-module", "better-sqlite3", "--version", electronVersion, "--module-dir", moduleDir],
  { stdio: "inherit" },
);
