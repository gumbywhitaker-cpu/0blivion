import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSuperAdmin, apiErrorResponse } from "@/lib/api-auth";

const schema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/support/[id]">) {
  try {
    await requireApiSuperAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const updated = await prisma.supportRequest.update({
      where: { id },
      data: {
        status: parsed.data.status,
        resolvedAt: ["RESOLVED", "CLOSED"].includes(parsed.data.status) ? new Date() : null,
      },
    });

    return NextResponse.json({ request: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
