-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "address" TEXT;
ALTER TABLE "Organization" ADD COLUMN "gstNumber" TEXT;
ALTER TABLE "Organization" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "HarvestMaturityTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orchardId" TEXT NOT NULL,
    "jobId" TEXT,
    "variety" TEXT NOT NULL,
    "testDate" DATETIME NOT NULL,
    "sampleSize" INTEGER,
    "dryMatterPercent" REAL,
    "brix" REAL NOT NULL,
    "minDryMatterRequired" REAL,
    "minBrixRequired" REAL,
    "passed" BOOLEAN NOT NULL,
    "labOrTester" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HarvestMaturityTest_orchardId_fkey" FOREIGN KEY ("orchardId") REFERENCES "Orchard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HarvestMaturityTest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HarvestMaturityTest_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SprayDiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orchardId" TEXT NOT NULL,
    "jobId" TEXT,
    "productName" TEXT NOT NULL,
    "activeIngredient" TEXT,
    "hsrNumber" TEXT,
    "rateApplied" REAL NOT NULL,
    "rateUnit" TEXT NOT NULL,
    "areaTreatedHa" REAL,
    "targetPestOrDisease" TEXT,
    "weatherConditions" TEXT,
    "applicationDate" DATETIME NOT NULL,
    "withholdingPeriodDays" INTEGER,
    "harvestSafeDate" DATETIME,
    "applicatorId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SprayDiaryEntry_orchardId_fkey" FOREIGN KEY ("orchardId") REFERENCES "Orchard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SprayDiaryEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SprayDiaryEntry_applicatorId_fkey" FOREIGN KEY ("applicatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoolstoreTemperatureLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperatureC" REAL NOT NULL,
    "humidityPercent" REAL,
    "minRangeC" REAL,
    "maxRangeC" REAL,
    "withinRange" BOOLEAN NOT NULL,
    "recordedById" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "CoolstoreTemperatureLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoolstoreTemperatureLog_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "HarvestMaturityTest_orchardId_idx" ON "HarvestMaturityTest"("orchardId");

-- CreateIndex
CREATE INDEX "HarvestMaturityTest_jobId_idx" ON "HarvestMaturityTest"("jobId");

-- CreateIndex
CREATE INDEX "SprayDiaryEntry_orchardId_idx" ON "SprayDiaryEntry"("orchardId");

-- CreateIndex
CREATE INDEX "SprayDiaryEntry_jobId_idx" ON "SprayDiaryEntry"("jobId");

-- CreateIndex
CREATE INDEX "SprayDiaryEntry_applicationDate_idx" ON "SprayDiaryEntry"("applicationDate");

-- CreateIndex
CREATE INDEX "CoolstoreTemperatureLog_organizationId_idx" ON "CoolstoreTemperatureLog"("organizationId");

-- CreateIndex
CREATE INDEX "CoolstoreTemperatureLog_loggedAt_idx" ON "CoolstoreTemperatureLog"("loggedAt");
