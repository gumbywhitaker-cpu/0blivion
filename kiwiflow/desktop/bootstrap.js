// First-launch database setup for the desktop app. Runs once, before the
// Next.js server starts, when no kiwiflow.db exists yet in this Windows
// user's app-data folder.
//
// This does NOT use Prisma Migrate or Prisma Client — bundling Prisma's own
// CLI/migration engine into the Electron app is unnecessary complexity for
// what's always a brand-new, empty database file: it just replays the same
// prisma/migrations/*/migration.sql files the real app's `prisma migrate
// dev` already generated (schema.prisma stays the single source of truth;
// nothing here hand-duplicates the schema) and inserts the same global
// Conductor rules prisma/seed.ts seeds in every other environment, from the
// same prisma/globalWorkflowRules.json both read.
//
// Builds into a temp file and only renames it into place on full success,
// so a crash mid-setup can't leave a half-built kiwiflow.db that a later
// launch would mistake for "already set up" (see main.js's
// fs.existsSync(dbPath) check) and skip bootstrapping entirely.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function run({ standaloneDir, migrationsDir, globalRulesPath, dbPath }) {
  const Database = require(path.join(standaloneDir, "node_modules", "better-sqlite3"));

  const tmpPath = `${dbPath}.setup-tmp`;
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(tmpPath);
  try {
    db.pragma("journal_mode = WAL");

    const migrationFolders = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(); // timestamp-prefixed folder names sort chronologically

    const applyAll = db.transaction(() => {
      for (const folder of migrationFolders) {
        const sql = fs.readFileSync(path.join(migrationsDir, folder, "migration.sql"), "utf8");
        db.exec(sql);
      }

      const rules = JSON.parse(fs.readFileSync(globalRulesPath, "utf8"));
      const insertRule = db.prepare(
        `INSERT INTO "WorkflowRule" ("id", "organizationId", "name", "eventType", "actions") VALUES (?, NULL, ?, ?, ?)`,
      );
      for (const rule of rules) {
        insertRule.run(crypto.randomUUID(), rule.name, rule.eventType, JSON.stringify(rule.actions));
      }
    });
    applyAll();
  } finally {
    db.close();
  }

  fs.renameSync(tmpPath, dbPath);
}

module.exports = { run };
