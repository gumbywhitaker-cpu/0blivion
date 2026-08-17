import "server-only";
import { prisma } from "@/lib/db";
import { daysBetween } from "@/lib/format";

/**
 * There's no background scheduler in this environment, so instead of a cron
 * job flipping SENT -> OVERDUE at midnight, we lazily reconcile status
 * whenever a business's invoices are read. Cheap (one query + a batch
 * update) and always correct by the time a human looks at the screen.
 */
export async function refreshOverdueInvoices(businessId: string) {
  const now = new Date();
  const candidates = await prisma.invoice.findMany({
    where: { businessId, status: { in: ["SENT", "PARTIALLY_PAID"] }, dueDate: { lt: now } },
    include: { payments: true },
  });

  for (const inv of candidates) {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    if (paid >= inv.amount) continue; // fully paid, shouldn't be in this list, skip defensively
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: "OVERDUE", daysOverdue: daysBetween(now, inv.dueDate) },
    });
  }
}
