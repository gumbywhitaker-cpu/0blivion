import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

async function loadLead(id: string, businessId: string) {
  const lead = await prisma.lead.findFirst({ where: { id, businessId } });
  if (!lead) throw new ApiError(404, "Lead not found.");
  return lead;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/leads/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business } = await requireApiBusiness();
    const lead = await prisma.lead.findFirst({
      where: { id, businessId: business.id },
      include: { customer: true, quotes: true, jobs: true },
    });
    if (!lead) throw new ApiError(404, "Lead not found.");
    return NextResponse.json({ lead });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(40).nullable().optional(),
  source: z.string().trim().max(80).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  estimatedValue: z.number().nonnegative().nullable().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "QUOTED", "WON", "LOST", "DORMANT"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  lostReason: z.string().trim().max(500).nullable().optional(),
  nextFollowupAt: z.string().datetime().nullable().optional(),
  markContacted: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/leads/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("records:edit");
    const lead = await loadLead(id, business.id);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { nextFollowupAt, markContacted, status, ...rest } = parsed.data;

    const data: Record<string, unknown> = { ...rest };
    if (status) {
      data.status = status;
      if (status === "WON") data.convertedAt = new Date();
    }
    if (nextFollowupAt !== undefined) {
      data.nextFollowupAt = nextFollowupAt ? new Date(nextFollowupAt) : null;
    }
    if (markContacted) data.lastContactedAt = new Date();

    const updated = await prisma.lead.update({ where: { id: lead.id }, data });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "lead.update",
      entityType: "Lead",
      entityId: lead.id,
    });

    return NextResponse.json({ lead: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/leads/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("records:delete");
    await loadLead(id, business.id);

    await prisma.lead.update({ where: { id }, data: { status: "LOST", lostReason: "Removed by user" } });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "lead.remove",
      entityType: "Lead",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
