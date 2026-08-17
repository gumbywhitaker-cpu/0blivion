import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const { business } = await requireApiBusiness();
    return NextResponse.json({ business });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  businessType: z.string().trim().max(80).optional(),
  industry: z.string().trim().max(80).optional(),
  employeeCount: z.string().trim().max(40).optional(),
  averageJobValue: z.number().nonnegative().optional(),
  monthlyRevenueRange: z.string().trim().max(40).optional(),
  crmMethod: z.string().trim().max(60).optional(),
  biggestHeadache: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  onboardingStep: z.number().int().min(0).max(10).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const { business, membership } = await requireApiBusiness("records:edit");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: parsed.data,
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "business.update",
      entityType: "Business",
      entityId: business.id,
    });

    return NextResponse.json({ business: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
