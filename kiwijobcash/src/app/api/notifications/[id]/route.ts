import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";

export async function PATCH(req: Request, ctx: RouteContext<"/api/notifications/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business } = await requireApiBusiness();
    const notification = await prisma.notification.findFirst({ where: { id, businessId: business.id } });
    if (!notification) throw new ApiError(404, "Notification not found.");

    const body = await req.json().catch(() => ({}));
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: body.read !== false },
    });
    return NextResponse.json({ notification: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
