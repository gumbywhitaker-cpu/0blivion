import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { nextJobNumber } from "@/lib/numbering";

export async function GET(req: Request) {
  try {
    const { business } = await requireApiBusiness();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const jobs = await prisma.job.findMany({
      where: { businessId: business.id, ...(status ? { status } : {}) },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const schema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  quoteId: z.string().optional(),
  leadId: z.string().optional(),
  title: z.string().trim().min(1, "Give the job a title.").max(200),
  jobType: z.string().trim().max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  scheduledDate: z.string().datetime().optional(),
  quotedAmount: z.number().nonnegative().optional(),
  labourCost: z.number().nonnegative().optional(),
  materialCost: z.number().nonnegative().optional(),
  otherCost: z.number().nonnegative().optional(),
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

    let job;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        job = await prisma.job.create({
          data: {
            businessId: business.id,
            ...parsed.data,
            scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : undefined,
            jobNumber: await nextJobNumber(business.id),
            status: "BOOKED",
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
      action: "job.create",
      entityType: "Job",
      entityId: job!.id,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
