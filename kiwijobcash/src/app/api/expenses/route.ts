import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const { business } = await requireApiBusiness();
    const expenses = await prisma.expense.findMany({
      where: { businessId: business.id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ expenses });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  category: z.string().trim().min(1, "Choose a category.").max(80),
  description: z.string().trim().max(500).optional(),
  amount: z.number().positive("Amount must be greater than zero."),
  date: z.string().datetime().optional(),
  jobId: z.string().optional(),
  supplier: z.string().trim().max(160).optional(),
  recurring: z.boolean().optional(),
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

    const expense = await prisma.expense.create({
      data: {
        businessId: business.id,
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "expense.create",
      entityType: "Expense",
      entityId: expense.id,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
