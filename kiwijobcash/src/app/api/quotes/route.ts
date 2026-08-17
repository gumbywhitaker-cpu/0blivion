import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { trackEvent } from "@/lib/events";
import { nextQuoteNumber } from "@/lib/numbering";

export async function GET(req: Request) {
  try {
    const { business } = await requireApiBusiness();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const quotes = await prisma.quote.findMany({
      where: { businessId: business.id, ...(status ? { status } : {}) },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotes });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  leadId: z.string().optional(),
  description: z.string().trim().max(2000).optional(),
  amount: z.number().positive("Amount must be greater than zero."),
  expiryDate: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
});

export async function POST(req: Request) {
  try {
    const { business, membership } = await requireApiBusiness("records:create");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: { id: parsed.data.customerId, businessId: business.id },
    });
    if (!customer) return NextResponse.json({ error: "That customer wasn't found." }, { status: 400 });

    let quote;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        quote = await prisma.quote.create({
          data: {
            businessId: business.id,
            customerId: parsed.data.customerId,
            leadId: parsed.data.leadId,
            description: parsed.data.description,
            amount: parsed.data.amount,
            expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
            status: parsed.data.status ?? "SENT",
            quoteNumber: await nextQuoteNumber(business.id),
          },
        });
        break;
      } catch (err: unknown) {
        if (attempt === 2) throw err;
      }
    }

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "quote.create",
      entityType: "Quote",
      entityId: quote!.id,
    });
    await trackEvent("first_quote_created", { businessId: business.id, userId: membership.userId });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
