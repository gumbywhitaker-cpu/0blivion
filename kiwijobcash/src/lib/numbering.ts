import "server-only";
import { prisma } from "@/lib/db";

export async function nextQuoteNumber(businessId: string) {
  const count = await prisma.quote.count({ where: { businessId } });
  return `Q-${String(count + 1).padStart(4, "0")}`;
}

export async function nextInvoiceNumber(businessId: string) {
  const count = await prisma.invoice.count({ where: { businessId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

export async function nextJobNumber(businessId: string) {
  const count = await prisma.job.count({ where: { businessId } });
  return `JOB-${String(count + 1).padStart(4, "0")}`;
}
