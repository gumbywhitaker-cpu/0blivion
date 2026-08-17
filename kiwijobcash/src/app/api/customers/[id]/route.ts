import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

async function loadCustomer(id: string, businessId: string) {
  const customer = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!customer) throw new ApiError(404, "Customer not found.");
  return customer;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/customers/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business } = await requireApiBusiness();
    const customer = await loadCustomer(id, business.id);
    return NextResponse.json({ customer });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  companyName: z.string().trim().max(160).nullable().optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  customerStatus: z.enum(["ACTIVE", "DORMANT", "VIP", "AT_RISK", "ARCHIVED"]).optional(),
  lastContactDate: z.string().datetime().nullable().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/customers/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("records:edit");
    await loadCustomer(id, business.id);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { lastContactDate, ...rest } = parsed.data;
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        ...(lastContactDate !== undefined
          ? { lastContactDate: lastContactDate ? new Date(lastContactDate) : null }
          : {}),
      },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "customer.update",
      entityType: "Customer",
      entityId: customer.id,
    });

    return NextResponse.json({ customer });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/customers/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("records:delete");
    await loadCustomer(id, business.id);

    await prisma.customer.update({ where: { id }, data: { customerStatus: "ARCHIVED" } });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "customer.archive",
      entityType: "Customer",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
