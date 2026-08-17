import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["PENDING", "APPROVED", "DISMISSED"]).optional(),
  suggestedMessage: z.string().max(4000).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/ai-actions/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("ai:approve_send");

    const action = await prisma.aIAction.findFirst({ where: { id, businessId: business.id } });
    if (!action) throw new ApiError(404, "Action not found.");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.status) {
      data.status = parsed.data.status;
      if (parsed.data.status === "APPROVED") data.approvedAt = new Date();
    }
    if (parsed.data.suggestedMessage !== undefined) data.suggestedMessage = parsed.data.suggestedMessage;
    if (parsed.data.scheduledFor !== undefined) {
      data.scheduledFor = parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null;
    }

    const updated = await prisma.aIAction.update({ where: { id: action.id }, data });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: `ai_action.${parsed.data.status?.toLowerCase() ?? "update"}`,
      entityType: "AIAction",
      entityId: action.id,
    });

    return NextResponse.json({ action: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
