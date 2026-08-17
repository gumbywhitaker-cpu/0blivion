import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Local/dev: SQLite file. For production, point DATABASE_URL at Postgres
    // and swap the adapter in src/lib/db.ts from better-sqlite3 to @prisma/adapter-pg.
    url: env("DATABASE_URL"),
  },
});
