-- AlterTable
ALTER TABLE "AIAction" ADD COLUMN "deliveryStatus" TEXT;
ALTER TABLE "AIAction" ADD COLUMN "scheduledFor" DATETIME;
ALTER TABLE "AIAction" ADD COLUMN "sendChannel" TEXT;
ALTER TABLE "AIAction" ADD COLUMN "sentAt" DATETIME;
