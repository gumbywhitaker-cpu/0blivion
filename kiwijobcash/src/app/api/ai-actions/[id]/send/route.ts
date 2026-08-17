import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { trackEvent } from "@/lib/events";
import { sendEmail, escapeHtml } from "@/lib/email";
import { canUseAiAction, incrementUsage } from "@/lib/usage";

const schema = z.object({ message: z.string().min(1).max(4000) });

const SUBJECTS: Record<string, string> = {
  LEAD_FOLLOWUP: "Following up on your enquiry",
  QUOTE_FOLLOWUP: "Following up on your quote",
  INVOICE_CHASE: "Payment reminder",
  CUSTOMER_REACTIVATION: "Checking in",
  REVIEW_REQUEST: "How did we do?",
};

export async function POST(req: Request, ctx: RouteContext<"/api/ai-actions/[id]/send">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("ai:approve_send");

    const action = await prisma.aIAction.findFirst({
      where: { id, businessId: business.id },
      include: { customer: true },
    });
    if (!action) throw new ApiError(404, "Action not found.");
    if (["SENT", "COMPLETED"].includes(action.status)) {
      throw new ApiError(409, "This action has already been sent.");
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "A message is required.");

    const quota = await canUseAiAction(business.id);
    if (!quota.allowed) {
      throw new ApiError(
        402,
        `You've used all ${quota.limit} AI actions on your plan this month. Upgrade to send more.`
      );
    }

    let deliveryStatus: "DELIVERED" | "NOT_CONFIGURED" | "FAILED" = "NOT_CONFIGURED";
    if (action.customer?.email) {
      const result = await sendEmail({
        to: action.customer.email,
        subject: SUBJECTS[action.type] ?? "A message from " + business.name,
        html: `<p>${escapeHtml(parsed.data.message).replace(/\n/g, "<br/>")}</p><p>— ${escapeHtml(business.name)}</p>`,
      });
      deliveryStatus = result.delivered ? "DELIVERED" : "NOT_CONFIGURED";
    }

    const updated = await prisma.aIAction.update({
      where: { id: action.id },
      data: {
        status: "SENT",
        suggestedMessage: parsed.data.message,
        sentAt: new Date(),
        sendChannel: "EMAIL",
        deliveryStatus,
        approvedAt: action.approvedAt ?? new Date(),
      },
    });

    await incrementUsage(business.id, { aiActions: 1, aiMessages: 1, emailsSent: deliveryStatus === "DELIVERED" ? 1 : 0 });
    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "ai_action.send",
      entityType: "AIAction",
      entityId: action.id,
      metadata: { deliveryStatus },
    });
    await trackEvent("first_message_sent", { businessId: business.id, userId: membership.userId });

    return NextResponse.json({ action: updated, deliveryStatus });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
