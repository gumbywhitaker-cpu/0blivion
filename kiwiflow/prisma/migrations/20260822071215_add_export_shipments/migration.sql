-- CreateTable
CREATE TABLE "ExportShipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packhouseOrgId" TEXT NOT NULL,
    "transportOrgId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREPARING',
    "mode" TEXT NOT NULL DEFAULT 'REEFER_VESSEL_PALLETS',
    "palletCount" INTEGER,
    "containerNumber" TEXT,
    "carrierBookingReference" TEXT,
    "shippingLine" TEXT,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "destinationPort" TEXT,
    "reeferSetpointC" REAL DEFAULT 0,
    "etd" DATETIME,
    "phytosanitaryCertificateNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExportShipment_packhouseOrgId_fkey" FOREIGN KEY ("packhouseOrgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExportShipment_transportOrgId_fkey" FOREIGN KEY ("transportOrgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ExportShipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExportShipmentStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exportShipmentId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT,
    "note" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExportShipmentStatusHistory_exportShipmentId_fkey" FOREIGN KEY ("exportShipmentId") REFERENCES "ExportShipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExportShipmentStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GradingResult" (
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
    "exportShipmentId" TEXT,
    CONSTRAINT "GradingResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GradingResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GradingResult_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GradingResult_exportShipmentId_fkey" FOREIGN KEY ("exportShipmentId") REFERENCES "ExportShipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GradingResult" ("averageBrix", "class1Percent", "class2Percent", "createdAt", "gradingDate", "id", "jobId", "notes", "organizationId", "recordedById", "rejectPercent", "sizeCurve", "sourceSystem", "totalTrayEquivalents") SELECT "averageBrix", "class1Percent", "class2Percent", "createdAt", "gradingDate", "id", "jobId", "notes", "organizationId", "recordedById", "rejectPercent", "sizeCurve", "sourceSystem", "totalTrayEquivalents" FROM "GradingResult";
DROP TABLE "GradingResult";
ALTER TABLE "new_GradingResult" RENAME TO "GradingResult";
CREATE INDEX "GradingResult_jobId_idx" ON "GradingResult"("jobId");
CREATE INDEX "GradingResult_organizationId_idx" ON "GradingResult"("organizationId");
CREATE INDEX "GradingResult_gradingDate_idx" ON "GradingResult"("gradingDate");
CREATE INDEX "GradingResult_exportShipmentId_idx" ON "GradingResult"("exportShipmentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ExportShipment_packhouseOrgId_idx" ON "ExportShipment"("packhouseOrgId");

-- CreateIndex
CREATE INDEX "ExportShipment_transportOrgId_idx" ON "ExportShipment"("transportOrgId");

-- CreateIndex
CREATE INDEX "ExportShipment_status_idx" ON "ExportShipment"("status");

-- CreateIndex
CREATE INDEX "ExportShipmentStatusHistory_exportShipmentId_idx" ON "ExportShipmentStatusHistory"("exportShipmentId");
