-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Broadcast_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Broadcast_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "broadcastId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BroadcastRecipient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "growerOrgId" TEXT NOT NULL,
    "contractorOrgId" TEXT,
    "orchardId" TEXT NOT NULL,
    "crewId" TEXT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "scheduledDate" DATETIME NOT NULL,
    "startTime" TEXT,
    "estimatedDurationMins" INTEGER,
    "instructions" TEXT,
    "rate" REAL,
    "unit" TEXT,
    "quantity" REAL,
    "destinationOrgId" TEXT,
    "assignedDriverId" TEXT,
    "loadDescription" TEXT,
    "etaAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_growerOrgId_fkey" FOREIGN KEY ("growerOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Job_contractorOrgId_fkey" FOREIGN KEY ("contractorOrgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_orchardId_fkey" FOREIGN KEY ("orchardId") REFERENCES "Orchard" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_destinationOrgId_fkey" FOREIGN KEY ("destinationOrgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("contractorOrgId", "createdAt", "createdById", "crewId", "estimatedDurationMins", "growerOrgId", "id", "instructions", "jobType", "orchardId", "priority", "quantity", "rate", "scheduledDate", "startTime", "status", "unit", "updatedAt") SELECT "contractorOrgId", "createdAt", "createdById", "crewId", "estimatedDurationMins", "growerOrgId", "id", "instructions", "jobType", "orchardId", "priority", "quantity", "rate", "scheduledDate", "startTime", "status", "unit", "updatedAt" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE INDEX "Job_growerOrgId_idx" ON "Job"("growerOrgId");
CREATE INDEX "Job_contractorOrgId_idx" ON "Job"("contractorOrgId");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_scheduledDate_idx" ON "Job"("scheduledDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Broadcast_organizationId_idx" ON "Broadcast"("organizationId");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_organizationId_idx" ON "BroadcastRecipient"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastRecipient_broadcastId_organizationId_key" ON "BroadcastRecipient"("broadcastId", "organizationId");
