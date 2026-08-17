import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { computeDailySummary } from "@/lib/agents/dailyManager";
import { formatMoney } from "@/lib/format";
import { sendEmail } from "@/lib/email";

/**
 * Generates the Daily Report and creates an in-app notification. Also
 * attempts an email send when a provider is configured — this is the same
 * computation used for the dashboard's "Good morning" summary, so the
 * numbers always match what's on screen.
 */
export async function POST() {
  try {
    const { business, user } = await requireApiBusiness("records:view");
    const summary = await computeDailySummary(business.id);

    const title = `Daily report: ${formatMoney(summary.moneyAtRisk)} at risk`;
    const lines = [
      `Good morning ${user.name.split(" ")[0]}.`,
      "",
      `MONEY AT RISK: ${formatMoney(summary.moneyAtRisk)}`,
      summary.topOpportunity
        ? `TOP OPPORTUNITY: ${formatMoney(summary.topOpportunity.value)} — ${summary.topOpportunity.title}`
        : "TOP OPPORTUNITY: none right now",
      `OVERDUE: ${formatMoney(summary.overdueTotal)}`,
      `LEADS NEEDING ATTENTION: ${summary.leadsNeedingAttention}`,
      "",
      "TODAY'S ACTIONS:",
      ...summary.topActions.map((a, i) => `${i + 1}. ${a.title} — ${a.description}`),
    ];
    const message = lines.join("\n");

    const notification = await prisma.notification.create({
      data: {
        businessId: business.id,
        userId: user.id,
        type: "DAILY_REPORT",
        title,
        message,
        priority: "MEDIUM",
        actionUrl: "/app/actions",
      },
    });

    const emailResult = await sendEmail({
      to: user.email,
      subject: `Kiwi Job Cash — ${title}`,
      html: `<pre style="font-family:inherit;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</pre>`,
    });

    return NextResponse.json({
      notification,
      summary,
      emailDelivered: emailResult.delivered,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
