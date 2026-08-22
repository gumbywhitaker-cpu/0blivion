-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "xeroInvoiceId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "xeroSyncedAt" DATETIME;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "xeroAccessToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN "xeroRefreshToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN "xeroTenantId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "xeroTokenExpires" DATETIME;
