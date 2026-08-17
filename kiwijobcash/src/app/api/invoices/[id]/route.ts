import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

async function loadInvoice(id: string, businessId: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id, businessId } });
  if (!invoice) throw new ApiError(404, "Invoice not found.");
  return invoice;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business } = await requireApiBusiness();
    const invoice = await prisma.invoice.findFirst({
      where: { id, businessId: business.id },
      include: { customer: true, payments: true },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found.");
    return NextResponse.json({ invoice });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "BAD_DEBT"]).optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("records:edit");
    const invoice = await loadInvoice(id, business.id);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { dueDate, status, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (dueDate) data.dueDate = new Date(dueDate);
    if (status) {
      data.status = status;
      if (status === "PAID") data.paidDate = new Date();
    }

    const updated = await prisma.invoice.update({ where: { id: invoice.id }, data });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "invoice.update",
      entityType: "Invoice",
      entityId: invoice.id,
    });

    return NextResponse.json({ invoice: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
