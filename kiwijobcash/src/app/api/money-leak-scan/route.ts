import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { calculateMoneyLeak } from "@/lib/money-leak-scan";
import { trackEvent } from "@/lib/events";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  businessName: z.string().trim().max(160).optional(),
  businessType: z.string().trim().max(80).optional(),
  monthlyRevenue: z.number().nonnegative(),
  employeeCount: z.number().int().nonnegative(),
  averageJobValue: z.number().nonnegative(),
  monthlyEnquiries: z.number().int().nonnegative(),
  monthlyQuotes: z.number().int().nonnegative(),
  overdueInvoiceCount: z.number().int().nonnegative(),
  overdueInvoiceValue: z.number().nonnegative(),
  dormantCustomerCount: z.number().int().nonnegative(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check your numbers and try again." },
      { status: 400 }
    );
  }

  const result = calculateMoneyLeak(parsed.data);

  const scan = await prisma.leadGenerationScan.create({
    data: {
      email: parsed.data.email,
      businessName: parsed.data.businessName,
      businessType: parsed.data.businessType,
      monthlyRevenue: parsed.data.monthlyRevenue,
      employeeCount: parsed.data.employeeCount,
      averageJobValue: parsed.data.averageJobValue,
      monthlyEnquiries: parsed.data.monthlyEnquiries,
      monthlyQuotes: parsed.data.monthlyQuotes,
      overdueInvoiceCount: parsed.data.overdueInvoiceCount,
      overdueInvoiceValue: parsed.data.overdueInvoiceValue,
      dormantCustomerCount: parsed.data.dormantCustomerCount,
      estimatedLeadLeak: result.leadLeak,
      estimatedQuoteLeak: result.quoteLeak,
      estimatedInvoiceLeak: result.invoiceLeak,
      estimatedDormantLeak: result.dormantLeak,
      estimatedTotalOpportunity: result.total,
      source: "money_leak_scan",
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
    },
  });

  await trackEvent("money_scan_completed", {
    properties: { total: result.total, scanId: scan.id },
  });

  return NextResponse.json({ scanId: scan.id, result });
}
