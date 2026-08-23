"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { emitEvent } from "@/lib/conductor/emit";
import { pushInvoiceToXero } from "@/lib/xero";
import { pushInvoiceToMyob } from "@/lib/myob";
import { recordAuditLog } from "@/lib/audit";

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

export async function pushInvoiceToXeroAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  assertCanManage(session.role);
  const invoiceId = String(formData.get("invoiceId"));

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, fromOrgId: session.organizationId },
  });
  if (!invoice) return;

  const result = await pushInvoiceToXero(invoiceId);

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: result.ok ? "xero.invoice_pushed" : "xero.invoice_push_failed",
    entityType: "Invoice",
    entityId: invoice.id,
    detail: result.ok ? { xeroInvoiceId: result.xeroInvoiceId } : { reason: result.reason },
  });

  revalidatePath(`/invoices/${invoice.id}`);
}

export async function pushInvoiceToMyobAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  assertCanManage(session.role);
  const invoiceId = String(formData.get("invoiceId"));

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, fromOrgId: session.organizationId },
  });
  if (!invoice) return;

  const result = await pushInvoiceToMyob(invoiceId);

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: result.ok ? "myob.invoice_pushed" : "myob.invoice_push_failed",
    entityType: "Invoice",
    entityId: invoice.id,
    detail: result.ok ? { myobInvoiceUid: result.myobInvoiceUid } : { reason: result.reason },
  });

  revalidatePath(`/invoices/${invoice.id}`);
}
