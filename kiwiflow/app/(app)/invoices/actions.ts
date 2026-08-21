"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { emitEvent } from "@/lib/conductor/emit";

export async function sendInvoiceAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  assertCanManage(session.role);
  const invoiceId = String(formData.get("invoiceId"));

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, fromOrgId: session.organizationId, status: "DRAFT" },
  });
  if (!invoice) return;

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "SENT", issuedAt: new Date() },
  });
  await emitEvent(session.organizationId, { type: "INVOICE_SENT", payload: { invoiceId: invoice.id } });
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/invoices");
}

export async function markPaidAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  assertCanManage(session.role);
  const invoiceId = String(formData.get("invoiceId"));

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      fromOrgId: session.organizationId,
      status: { in: ["SENT", "OVERDUE"] },
    },
  });
  if (!invoice) return;

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath("/invoices");
}
