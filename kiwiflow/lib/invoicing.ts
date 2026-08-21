import { prisma } from "@/lib/db";

export const DEFAULT_GST_RATE = 0.15;

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  return `KF-${year}-${String(count + 1).padStart(5, "0")}`;
}

/**
 * The concrete version of the spec's "JOB_COMPLETE -> generate invoice draft"
 * workflow (docs/BLUEPRINT.md Section 6). Billing direction is contractor -> grower:
 * the contractor performed the work, so the contractor's org is `fromOrg` and the
 * grower's org is `toOrg`. A job with no assigned contractor (grower doing the work
 * in-house) has nothing to bill and is skipped.
 */
export async function createInvoiceDraftForJob(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });

  if (!job.contractorOrgId) {
    return null;
  }
  if (job.status !== "COMPLETE") {
    throw new Error(`Cannot invoice job ${jobId}: status is ${job.status}, not COMPLETE`);
  }

  const existing = await prisma.invoiceItem.findFirst({ where: { jobId: job.id } });
  if (existing) {
    return prisma.invoice.findUnique({ where: { id: existing.invoiceId } });
  }

  const quantity = job.quantity ?? 1;
  const rate = job.rate ?? 0;
  const amount = round2(quantity * rate);
  const gstAmount = round2(amount * DEFAULT_GST_RATE);
  const total = round2(amount + gstAmount);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: await nextInvoiceNumber(),
      fromOrgId: job.contractorOrgId,
      toOrgId: job.growerOrgId,
      status: "DRAFT",
      gstRate: DEFAULT_GST_RATE,
      subtotal: amount,
      gstAmount,
      total,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days, standard NZ trade terms
      items: {
        create: [
          {
            jobId: job.id,
            description: `${job.jobType} — job ${job.id.slice(-8)}`,
            quantity,
            rate,
            amount,
          },
        ],
      },
    },
  });

  await prisma.job.update({ where: { id: job.id }, data: { status: "INVOICED" } });
  await prisma.jobStatusHistory.create({
    data: {
      jobId: job.id,
      fromStatus: "COMPLETE",
      toStatus: "INVOICED",
      changedById: null,
      note: `Auto-invoiced by Conductor as ${invoice.invoiceNumber}`,
    },
  });

  return invoice;
}
