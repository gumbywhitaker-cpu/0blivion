-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobStatusHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JobStatusHistory" ("changedAt", "changedById", "fromStatus", "id", "jobId", "note", "toStatus") SELECT "changedAt", "changedById", "fromStatus", "id", "jobId", "note", "toStatus" FROM "JobStatusHistory";
DROP TABLE "JobStatusHistory";
ALTER TABLE "new_JobStatusHistory" RENAME TO "JobStatusHistory";
CREATE INDEX "JobStatusHistory_jobId_idx" ON "JobStatusHistory"("jobId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
