-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "myobInvoiceUid" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "myobSyncedAt" DATETIME;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "myobAccessToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN "myobCfPassword" TEXT;
ALTER TABLE "Organization" ADD COLUMN "myobCfUsername" TEXT;
ALTER TABLE "Organization" ADD COLUMN "myobCompanyFileUid" TEXT;
ALTER TABLE "Organization" ADD COLUMN "myobRefreshToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN "myobTokenExpires" DATETIME;
