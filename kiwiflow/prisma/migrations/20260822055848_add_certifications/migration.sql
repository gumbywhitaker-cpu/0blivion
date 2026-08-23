-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orchardId" TEXT NOT NULL,
    "scheme" TEXT NOT NULL,
    "certificateNumber" TEXT,
    "ggn" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "issuedDate" DATETIME,
    "expiryDate" DATETIME,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Certification_orchardId_fkey" FOREIGN KEY ("orchardId") REFERENCES "Orchard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Certification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Certification_orchardId_idx" ON "Certification"("orchardId");

-- CreateIndex
CREATE INDEX "Certification_status_idx" ON "Certification"("status");
