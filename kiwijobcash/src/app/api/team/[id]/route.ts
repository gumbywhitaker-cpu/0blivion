import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

async function loadMember(id: string, businessId: string) {
  const member = await prisma.businessMember.findFirst({ where: { id, businessId } });
  if (!member) throw new ApiError(404, "Team member not found.");
  return member;
}

const schema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "READ_ONLY"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/team/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("team:manage");
    const target = await loadMember(id, business.id);

    if (target.role === "OWNER") {
      throw new ApiError(400, "The business owner's role can't be changed here.");
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const updated = await prisma.businessMember.update({
      where: { id: target.id },
      data: parsed.data,
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "team.member_updated",
      entityType: "BusinessMember",
      entityId: target.id,
      metadata: parsed.data,
    });

    return NextResponse.json({ member: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/team/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("team:manage");
    const target = await loadMember(id, business.id);

    if (target.role === "OWNER") {
      throw new ApiError(400, "The business owner can't be removed.");
    }
    if (target.userId === membership.userId) {
      throw new ApiError(400, "You can't remove yourself from the team.");
    }

    await prisma.businessMember.delete({ where: { id: target.id } });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "team.member_removed",
      entityType: "BusinessMember",
      entityId: target.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
