import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const { business } = await requireApiBusiness();
    const settings = await prisma.automationSettings.upsert({
      where: { businessId: business.id },
      update: {},
      create: { businessId: business.id },
    });
    return NextResponse.json({ settings });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  aiRecommendationsEnabled: z.boolean().optional(),
  dailyReportEnabled: z.boolean().optional(),
  dailyReportTime: z.string().trim().max(5).optional(),
  dailyReportEmail: z.boolean().optional(),
  dailyReportSms: z.boolean().optional(),
  emailFollowupSuggestions: z.boolean().optional(),
  smsFollowupSuggestions: z.boolean().optional(),
  automaticSending: z.boolean().optional(),
  quoteReminderDays1: z.number().int().min(1).max(60).optional(),
  quoteReminderDays2: z.number().int().min(1).max(60).optional(),
  invoiceReminderDays1: z.number().int().min(1).max(60).optional(),
  invoiceReminderDays2: z.number().int().min(1).max(60).optional(),
  invoiceReminderDays3: z.number().int().min(1).max(60).optional(),
  customerReactivationDays: z.number().int().min(7).max(730).optional(),
  reviewRequestsEnabled: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const { business, membership } = await requireApiBusiness("automation:manage");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const settings = await prisma.automationSettings.upsert({
      where: { businessId: business.id },
      update: parsed.data,
      create: { businessId: business.id, ...parsed.data },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "automation_settings.update",
      entityType: "AutomationSettings",
      entityId: settings.id,
    });

    return NextResponse.json({ settings });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
