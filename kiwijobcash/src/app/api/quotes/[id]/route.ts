import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

async function loadQuote(id: string, businessId: string) {
  const quote = await prisma.quote.findFirst({ where: { id, businessId } });
  if (!quote) throw new ApiError(404, "Quote not found.");
  return quote;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/quotes/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business } = await requireApiBusiness();
    const quote = await prisma.quote.findFirst({
      where: { id, businessId: business.id },
      include: { customer: true },
    });
    if (!quote) throw new ApiError(404, "Quote not found.");
    return NextResponse.json({ quote });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  description: z.string().trim().max(2000).nullable().optional(),
  amount: z.number().positive().optional(),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "FOLLOW_UP", "ACCEPTED", "DECLINED", "EXPIRED"]).optional(),
  expiryDate: z.string().datetime().nullable().optional(),
  lostReason: z.string().trim().max(500).nullable().optional(),
  markFollowedUp: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/quotes/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("records:edit");
    const quote = await loadQuote(id, business.id);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { expiryDate, markFollowedUp, status, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (status) {
      data.status = status;
      if (status === "ACCEPTED") data.acceptedAt = new Date();
      if (status === "DECLINED") data.declinedAt = new Date();
    }
    if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (markFollowedUp) data.lastFollowupAt = new Date();

    const updated = await prisma.quote.update({ where: { id: quote.id }, data });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "quote.update",
      entityType: "Quote",
      entityId: quote.id,
    });

    return NextResponse.json({ quote: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
