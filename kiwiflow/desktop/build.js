// Assembles desktop/resources/ from the Next.js repo's own build output —
// run after `npm run build` (with next.config.ts's output:"standalone") in
// the kiwiflow/ root, before `electron-builder` packages the app. Nothing
// here is a second copy of the app: it's the same .next/standalone build
// every deploy of this repo produces, just relocated for packaging.
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const resourcesDir = path.join(__dirname, "resources");
const standaloneDir = path.join(resourcesDir, "app-standalone");

function requireExists(p, hint) {
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p}\n${hint}`);
    process.exit(1);
  }
}

requireExists(path.join(repoRoot, ".next", "standalone"), "Run `npm run build` in kiwiflow/ first (next.config.ts must have output: \"standalone\").");
requireExists(path.join(repoRoot, ".next", "static"), "Run `npm run build` in kiwiflow/ first.");

fs.rmSync(resourcesDir, { recursive: true, force: true });
fs.mkdirSync(resourcesDir, { recursive: true });

fs.cpSync(path.join(repoRoot, ".next", "standalone"), standaloneDir, { recursive: true });
fs.cpSync(path.join(repoRoot, ".next", "static"), path.join(standaloneDir, ".next", "static"), { recursive: true });
fs.cpSync(path.join(repoRoot, "public"), path.join(standaloneDir, "public"), { recursive: true });
fs.cpSync(path.join(repoRoot, "prisma", "migrations"), path.join(resourcesDir, "migrations"), { recursive: true });
fs.copyFileSync(path.join(repoRoot, "prisma", "globalWorkflowRules.json"), path.join(resourcesDir, "globalWorkflowRules.json"));

// Next.js copies a project-root .env into .next/standalone if one exists at
// build time. On the real CI build that never happens (no .env is checked
// into git), but this is a hard guard against ever shipping a developer's
// local secrets in the installer regardless.
const strayEnv = path.join(standaloneDir, ".env");
if (fs.existsSync(strayEnv)) fs.rmSync(strayEnv);

console.log(`Assembled ${resourcesDir}`);
