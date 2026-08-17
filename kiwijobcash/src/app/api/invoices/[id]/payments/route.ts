import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { trackEvent } from "@/lib/events";

const schema = z.object({
  amount: z.number().positive("Amount must be greater than zero."),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]).optional(),
  reference: z.string().trim().max(120).optional(),
  paymentDate: z.string().datetime().optional(),
});

/** Records a payment against an invoice and flips status to PARTIALLY_PAID/PAID. */
export async function POST(req: Request, ctx: RouteContext<"/api/invoices/[id]/payments">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("records:edit");

    const invoice = await prisma.invoice.findFirst({
      where: { id, businessId: business.id },
      include: { payments: true },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found.");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const paidSoFar = invoice.payments.reduce((s, p) => s + p.amount, 0);
    const newTotal = paidSoFar + parsed.data.amount;
    const newStatus = newTotal >= invoice.amount ? "PAID" : "PARTIALLY_PAID";

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          businessId: business.id,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: parsed.data.amount,
          method: parsed.data.method,
          reference: parsed.data.reference,
          paymentDate: parsed.data.paymentDate ? new Date(parsed.data.paymentDate) : new Date(),
        },
      }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          paidDate: newStatus === "PAID" ? new Date() : invoice.paidDate,
        },
      }),
    ]);

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "invoice.payment_recorded",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { amount: parsed.data.amount, newStatus },
    });
    if (newStatus === "PAID") {
      await trackEvent("money_recovered", {
        businessId: business.id,
        properties: { amount: invoice.amount, type: "INVOICE_PAID" },
      });
    }

    return NextResponse.json({ payment, status: newStatus });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
