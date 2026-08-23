-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crewMemberId" TEXT NOT NULL,
    "jobId" TEXT,
    "clockIn" DATETIME NOT NULL,
    "clockOut" DATETIME,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeEntry_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "CrewMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PieceRateRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crewMemberId" TEXT NOT NULL,
    "jobId" TEXT,
    "recordDate" DATETIME NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "ratePerUnit" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PieceRateRecord_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "CrewMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PieceRateRecord_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BiosecurityInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orchardId" TEXT NOT NULL,
    "inspectionDate" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "actionTaken" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "inspectedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BiosecurityInspection_orchardId_fkey" FOREIGN KEY ("orchardId") REFERENCES "Orchard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BiosecurityInspection_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GradingResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "gradingDate" DATETIME NOT NULL,
    "totalTrayEquivalents" REAL NOT NULL,
    "class1Percent" REAL,
    "class2Percent" REAL,
    "rejectPercent" REAL,
    "averageBrix" REAL,
    "sizeCurve" TEXT,
    "sourceSystem" TEXT NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GradingResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GradingResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GradingResult_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrewMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crewId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "userId" TEXT,
    "employmentType" TEXT NOT NULL DEFAULT 'HOURLY',
    "isRse" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" REAL,
    "minGuaranteedHoursPerWeek" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrewMember_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrewMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CrewMember" ("createdAt", "crewId", "id", "name", "phone", "userId") SELECT "createdAt", "crewId", "id", "name", "phone", "userId" FROM "CrewMember";
DROP TABLE "CrewMember";
ALTER TABLE "new_CrewMember" RENAME TO "CrewMember";
CREATE UNIQUE INDEX "CrewMember_userId_key" ON "CrewMember"("userId");
CREATE INDEX "CrewMember_crewId_idx" ON "CrewMember"("crewId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TimeEntry_crewMemberId_clockIn_idx" ON "TimeEntry"("crewMemberId", "clockIn");

-- CreateIndex
CREATE INDEX "TimeEntry_jobId_idx" ON "TimeEntry"("jobId");

-- CreateIndex
CREATE INDEX "PieceRateRecord_crewMemberId_recordDate_idx" ON "PieceRateRecord"("crewMemberId", "recordDate");

-- CreateIndex
CREATE INDEX "PieceRateRecord_jobId_idx" ON "PieceRateRecord"("jobId");

-- CreateIndex
CREATE INDEX "BiosecurityInspection_orchardId_idx" ON "BiosecurityInspection"("orchardId");

-- CreateIndex
CREATE INDEX "BiosecurityInspection_inspectionDate_idx" ON "BiosecurityInspection"("inspectionDate");

-- CreateIndex
CREATE INDEX "BiosecurityInspection_riskLevel_idx" ON "BiosecurityInspection"("riskLevel");

-- CreateIndex
CREATE INDEX "GradingResult_jobId_idx" ON "GradingResult"("jobId");

-- CreateIndex
CREATE INDEX "GradingResult_organizationId_idx" ON "GradingResult"("organizationId");

-- CreateIndex
CREATE INDEX "GradingResult_gradingDate_idx" ON "GradingResult"("gradingDate");
