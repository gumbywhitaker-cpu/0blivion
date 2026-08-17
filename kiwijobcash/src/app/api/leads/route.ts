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
    const status = searchParams.get("status");

    const leads = await prisma.lead.findMany({
      where: { businessId: business.id, ...(status ? { status } : {}) },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(160),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  estimatedValue: z.number().nonnegative().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  customerId: z.string().optional(),
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

    if (parsed.data.customerId) {
      const owns = await prisma.customer.findFirst({
        where: { id: parsed.data.customerId, businessId: business.id },
      });
      if (!owns) {
        return NextResponse.json({ error: "That customer wasn't found." }, { status: 400 });
      }
    }

    const lead = await prisma.lead.create({
      data: { businessId: business.id, ...parsed.data },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "lead.create",
      entityType: "Lead",
      entityId: lead.id,
    });
    await trackEvent("first_lead_created", { businessId: business.id, userId: membership.userId });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
