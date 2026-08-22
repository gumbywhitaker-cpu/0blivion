-- CreateTable
CREATE TABLE "SafetyIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orchardId" TEXT NOT NULL,
    "incidentDate" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "injuryInvolved" BOOLEAN NOT NULL DEFAULT false,
    "actionTaken" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "reportedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SafetyIncident_orchardId_fkey" FOREIGN KEY ("orchardId") REFERENCES "Orchard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SafetyIncident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SafetyIncident_orchardId_idx" ON "SafetyIncident"("orchardId");

-- CreateIndex
CREATE INDEX "SafetyIncident_incidentDate_idx" ON "SafetyIncident"("incidentDate");

-- CreateIndex
CREATE INDEX "SafetyIncident_severity_idx" ON "SafetyIncident"("severity");
