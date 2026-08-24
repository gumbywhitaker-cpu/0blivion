-- CreateTable
CREATE TABLE "ModularPipeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "activePack" TEXT NOT NULL DEFAULT 'packing_house',
    "enabledDocTypes" TEXT NOT NULL DEFAULT '["quality_log","bin_origin","rse_timesheet"]',
    "maxShiftHours" REAL NOT NULL DEFAULT 16,
    "ocrConfidenceThreshold" REAL NOT NULL DEFAULT 0.6,
    "hoursRoundingToleranceMinutes" INTEGER NOT NULL DEFAULT 6,
    "strictCrossDocChecks" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModularPipeConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModularPipeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "operatorId" TEXT,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "rawText" TEXT,
    "imageNote" TEXT,
    "sourceTypeProvisional" TEXT NOT NULL,
    "sourceTypeFinal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unclassified',
    "classificationReason" TEXT,
    "packVersion" TEXT NOT NULL DEFAULT 'packing_house_pack_v1.0.0',
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "claudeModelVersion" TEXT,
    "pipelineConfigVersion" TEXT NOT NULL DEFAULT '1',
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "timestampReceived" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classifiedAt" DATETIME,
    CONSTRAINT "ModularPipeDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModularPipeDocument_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModularPipeQualityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "qualityLogIdRaw" TEXT,
    "date" TEXT,
    "time" TEXT,
    "blockIdRaw" TEXT,
    "blockIdNormalized" TEXT,
    "binIdsRawJson" TEXT NOT NULL DEFAULT '[]',
    "variety" TEXT,
    "grade" TEXT,
    "defectsJson" TEXT NOT NULL DEFAULT '[]',
    "inspectorIdRaw" TEXT,
    "comments" TEXT,
    "linkedLoadIdRaw" TEXT,
    "status" TEXT NOT NULL DEFAULT 'invalid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModularPipeQualityLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ModularPipeDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModularPipeBinOrigin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "binIdRaw" TEXT NOT NULL,
    "binIdNormalized" TEXT,
    "harvestDate" TEXT,
    "orchardIdRaw" TEXT,
    "blockIdRaw" TEXT,
    "variety" TEXT,
    "pickerGroupIdRaw" TEXT,
    "pickerIdsRawJson" TEXT NOT NULL DEFAULT '[]',
    "loadIdRaw" TEXT,
    "destinationSiteIdRaw" TEXT,
    "specialHandlingFlagsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'invalid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModularPipeBinOrigin_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ModularPipeDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModularPipeRseTimesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "timesheetIdRaw" TEXT,
    "workerIdRaw" TEXT,
    "workerNameRaw" TEXT,
    "workerNameNormalized" TEXT,
    "resolvedCrewMemberId" TEXT,
    "date" TEXT,
    "shiftStartTime" TEXT,
    "shiftEndTime" TEXT,
    "breaksJson" TEXT NOT NULL DEFAULT '[]',
    "tasksJson" TEXT NOT NULL DEFAULT '[]',
    "totalHoursReported" REAL,
    "totalHoursComputed" REAL,
    "overtimeHours" REAL,
    "payRate" REAL,
    "supervisorIdRaw" TEXT,
    "approvalsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'invalid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModularPipeRseTimesheet_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ModularPipeDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModularPipeIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordId" TEXT,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "field" TEXT,
    "suggestedAction" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolutionNote" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModularPipeIssue_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ModularPipeDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModularPipeIssue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModularPipeIssue_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ModularPipeConfig_organizationId_key" ON "ModularPipeConfig"("organizationId");

-- CreateIndex
CREATE INDEX "ModularPipeConfig_organizationId_idx" ON "ModularPipeConfig"("organizationId");

-- CreateIndex
CREATE INDEX "ModularPipeDocument_organizationId_status_idx" ON "ModularPipeDocument"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ModularPipeDocument_organizationId_sourceTypeFinal_idx" ON "ModularPipeDocument"("organizationId", "sourceTypeFinal");

-- CreateIndex
CREATE INDEX "ModularPipeQualityLog_documentId_idx" ON "ModularPipeQualityLog"("documentId");

-- CreateIndex
CREATE INDEX "ModularPipeQualityLog_organizationId_blockIdNormalized_idx" ON "ModularPipeQualityLog"("organizationId", "blockIdNormalized");

-- CreateIndex
CREATE INDEX "ModularPipeBinOrigin_documentId_idx" ON "ModularPipeBinOrigin"("documentId");

-- CreateIndex
CREATE INDEX "ModularPipeBinOrigin_organizationId_binIdNormalized_idx" ON "ModularPipeBinOrigin"("organizationId", "binIdNormalized");

-- CreateIndex
CREATE INDEX "ModularPipeRseTimesheet_documentId_idx" ON "ModularPipeRseTimesheet"("documentId");

-- CreateIndex
CREATE INDEX "ModularPipeRseTimesheet_organizationId_workerIdRaw_idx" ON "ModularPipeRseTimesheet"("organizationId", "workerIdRaw");

-- CreateIndex
CREATE INDEX "ModularPipeIssue_documentId_idx" ON "ModularPipeIssue"("documentId");

-- CreateIndex
CREATE INDEX "ModularPipeIssue_organizationId_resolved_severity_idx" ON "ModularPipeIssue"("organizationId", "resolved", "severity");

-- CreateIndex
CREATE INDEX "ModularPipeIssue_code_idx" ON "ModularPipeIssue"("code");
