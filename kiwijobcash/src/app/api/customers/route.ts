import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { trackEvent } from "@/lib/events";

export async function GET(req: Request) {
  try {
    const { business } = await requireApiBusiness();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: {
        businessId: business.id,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { companyName: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(160),
  companyName: z.string().trim().max(160).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
  customerStatus: z.enum(["ACTIVE", "DORMANT", "VIP", "AT_RISK", "ARCHIVED"]).optional(),
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

    const customer = await prisma.customer.create({
      data: { businessId: business.id, ...parsed.data },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "customer.create",
      entityType: "Customer",
      entityId: customer.id,
    });
    await trackEvent("first_customer_created", { businessId: business.id, userId: membership.userId });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
