-- CreateTable
CREATE TABLE "WageTopUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crewMemberId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "hoursWorked" REAL NOT NULL,
    "pieceRateEarnings" REAL NOT NULL,
    "minimumWageRate" REAL NOT NULL,
    "requiredMinimum" REAL NOT NULL,
    "shortfall" REAL NOT NULL,
    "computedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WageTopUp_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "CrewMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WageTopUp_computedById_fkey" FOREIGN KEY ("computedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "minimumWageType" TEXT NOT NULL DEFAULT 'ADULT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrewMember_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrewMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CrewMember" ("createdAt", "crewId", "employmentType", "hourlyRate", "id", "isRse", "minGuaranteedHoursPerWeek", "name", "phone", "userId") SELECT "createdAt", "crewId", "employmentType", "hourlyRate", "id", "isRse", "minGuaranteedHoursPerWeek", "name", "phone", "userId" FROM "CrewMember";
DROP TABLE "CrewMember";
ALTER TABLE "new_CrewMember" RENAME TO "CrewMember";
CREATE UNIQUE INDEX "CrewMember_userId_key" ON "CrewMember"("userId");
CREATE INDEX "CrewMember_crewId_idx" ON "CrewMember"("crewId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WageTopUp_crewMemberId_idx" ON "WageTopUp"("crewMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "WageTopUp_crewMemberId_periodStart_key" ON "WageTopUp"("crewMemberId", "periodStart");
