import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { trackEvent } from "@/lib/events";

const schema = z.object({
  outcome: z.enum(["WON", "LOST", "PARTIAL", "NO_RESPONSE"]),
  resultValue: z.number().nonnegative().nullable().optional(),
});

/** Confirms the outcome of a sent AI action — the core "Money Recovered" mechanic. */
export async function POST(req: Request, ctx: RouteContext<"/api/ai-actions/[id]/complete">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("ai:approve_send");

    const action = await prisma.aIAction.findFirst({ where: { id, businessId: business.id } });
    if (!action) throw new ApiError(404, "Action not found.");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Invalid input.");

    const resultValue =
      parsed.data.outcome === "WON"
        ? parsed.data.resultValue ?? action.estimatedValue ?? 0
        : parsed.data.outcome === "PARTIAL"
          ? parsed.data.resultValue ?? 0
          : 0;

    const updated = await prisma.aIAction.update({
      where: { id: action.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        resultOutcome: parsed.data.outcome,
        resultValue,
      },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "ai_action.complete",
      entityType: "AIAction",
      entityId: action.id,
      metadata: { outcome: parsed.data.outcome, resultValue },
    });

    if (resultValue > 0) {
      await trackEvent("money_recovered", {
        businessId: business.id,
        properties: { amount: resultValue, type: action.type },
      });
    }

    return NextResponse.json({ action: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
