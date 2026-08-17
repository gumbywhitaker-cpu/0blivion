import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { trackEvent } from "@/lib/events";
import { nextInvoiceNumber } from "@/lib/numbering";

export async function GET(req: Request) {
  try {
    const { business } = await requireApiBusiness();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const invoices = await prisma.invoice.findMany({
      where: { businessId: business.id, ...(status ? { status } : {}) },
      include: { customer: true, payments: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  jobId: z.string().optional(),
  amount: z.number().positive("Amount must be greater than zero."),
  dueDate: z.string().datetime(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
});

export async function POST(req: Request) {
  try {
    const { business, membership } = await requireApiBusiness("records:create");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: { id: parsed.data.customerId, businessId: business.id },
    });
    if (!customer) return NextResponse.json({ error: "That customer wasn't found." }, { status: 400 });

    let invoice;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        invoice = await prisma.invoice.create({
          data: {
            businessId: business.id,
            customerId: parsed.data.customerId,
            jobId: parsed.data.jobId,
            amount: parsed.data.amount,
            dueDate: new Date(parsed.data.dueDate),
            notes: parsed.data.notes,
            status: parsed.data.status ?? "SENT",
            invoiceNumber: await nextInvoiceNumber(business.id),
          },
        });
        break;
      } catch (err: unknown) {
        if (attempt === 2) throw err;
      }
    }

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "invoice.create",
      entityType: "Invoice",
      entityId: invoice!.id,
    });
    await trackEvent("first_invoice_created", { businessId: business.id, userId: membership.userId });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
