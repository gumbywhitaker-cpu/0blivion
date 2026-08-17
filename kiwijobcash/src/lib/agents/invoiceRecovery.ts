import "server-only";
import { prisma } from "@/lib/db";
import { daysBetween } from "@/lib/format";
import type { ActionCandidate, Priority } from "@/lib/agents/types";

export type ReminderTone = "FRIENDLY" | "FIRM" | "FINAL";

export function reminderTone(daysOverdue: number, days2: number, days3: number): ReminderTone {
  if (daysOverdue >= days3) return "FINAL";
  if (daysOverdue >= days2) return "FIRM";
  return "FRIENDLY";
}

const TEMPLATES: Record<ReminderTone, (name: string, invoiceNumber: string, amount: number) => string> = {
  FRIENDLY: (name, invoiceNumber, amount) =>
    `Hi ${name}, just a friendly reminder that invoice ${invoiceNumber} for $${Math.round(amount)} is now overdue. Let us know if you have any questions. Cheers.`,
  FIRM: (name, invoiceNumber, amount) =>
    `Hi ${name}, invoice ${invoiceNumber} for $${Math.round(amount)} is still outstanding. Could you please arrange payment or let us know if there's an issue? Thanks.`,
  FINAL: (name, invoiceNumber, amount) =>
    `Hi ${name}, this is a final reminder that invoice ${invoiceNumber} for $${Math.round(amount)} remains unpaid. Please arrange payment as soon as possible, or get in touch to discuss.`,
};

export async function runInvoiceRecoveryAgent(businessId: string): Promise<ActionCandidate[]> {
  const settings = await prisma.automationSettings.findUnique({ where: { businessId } });
  const days2 = settings?.invoiceReminderDays2 ?? 7;
  const days3 = settings?.invoiceReminderDays3 ?? 14;

  const invoices = await prisma.invoice.findMany({
    where: { businessId, status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] } },
    include: { customer: true, payments: true },
  });

  const now = new Date();
  const candidates: ActionCandidate[] = [];

  for (const invoice of invoices) {
    if (invoice.dueDate >= now) continue;
    const daysOverdue = daysBetween(now, invoice.dueDate);
    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    const balance = Math.max(0, invoice.amount - paid);
    if (balance <= 0) continue;

    const tone = reminderTone(daysOverdue, days2, days3);
    const priority: Priority = balance >= 1000 || daysOverdue >= days3 ? "HIGH" : balance >= 300 || daysOverdue >= days2 ? "MEDIUM" : "LOW";

    candidates.push({
      type: "INVOICE_CHASE",
      entityType: "Invoice",
      entityId: invoice.id,
      customerId: invoice.customerId,
      invoiceId: invoice.id,
      title: invoice.customer.name,
      description: `${invoice.invoiceNumber} — ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
      estimatedValue: balance,
      priority,
      aiReasoningSummary: `Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue with $${Math.round(balance)} outstanding. Sending a ${tone.toLowerCase()} reminder.`,
      suggestedMessage: TEMPLATES[tone](invoice.customer.name, invoice.invoiceNumber, balance),
    });
  }

  return candidates;
}
