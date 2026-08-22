-- CreateTable
CREATE TABLE "DailyBriefing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "briefingDate" DATETIME NOT NULL,
    "content" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyBriefing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DailyBriefing_organizationId_idx" ON "DailyBriefing"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBriefing_organizationId_briefingDate_key" ON "DailyBriefing"("organizationId", "briefingDate");
