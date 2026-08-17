import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

async function loadJob(id: string, businessId: string) {
  const job = await prisma.job.findFirst({ where: { id, businessId } });
  if (!job) throw new ApiError(404, "Job not found.");
  return job;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business } = await requireApiBusiness();
    const job = await prisma.job.findFirst({
      where: { id, businessId: business.id },
      include: { customer: true, invoices: true },
    });
    if (!job) throw new ApiError(404, "Job not found.");
    return NextResponse.json({ job });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

const CLOSED_STATUSES = ["COMPLETED", "INVOICED", "PAID"];

const schema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  jobType: z.string().trim().max(80).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z
    .enum(["LEAD", "QUOTED", "BOOKED", "IN_PROGRESS", "COMPLETED", "INVOICED", "PAID", "CANCELLED"])
    .optional(),
  scheduledDate: z.string().datetime().nullable().optional(),
  actualRevenue: z.number().nonnegative().nullable().optional(),
  labourCost: z.number().nonnegative().optional(),
  materialCost: z.number().nonnegative().optional(),
  otherCost: z.number().nonnegative().optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/jobs/[id]">) {
  try {
    const { id } = await ctx.params;
    const { business, membership } = await requireApiBusiness("records:edit");
    const job = await loadJob(id, business.id);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { scheduledDate, status, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (scheduledDate !== undefined) data.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;

    const revenue = rest.actualRevenue ?? job.actualRevenue ?? job.quotedAmount ?? 0;
    const labour = rest.labourCost ?? job.labourCost;
    const material = rest.materialCost ?? job.materialCost;
    const other = rest.otherCost ?? job.otherCost;

    const justCompleted = status && CLOSED_STATUSES.includes(status) && !CLOSED_STATUSES.includes(job.status);

    if (status) {
      data.status = status;
      if (justCompleted) {
        data.completedDate = new Date();
        data.actualRevenue = revenue;
        data.grossProfit = revenue - labour - material - other;
        data.grossMargin = revenue > 0 ? ((revenue - labour - material - other) / revenue) * 100 : null;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.job.update({ where: { id: job.id }, data });
      if (justCompleted) {
        await tx.customer.update({
          where: { id: job.customerId },
          data: {
            lifetimeValue: { increment: revenue },
            totalJobs: { increment: 1 },
            lastJobDate: result.completedDate ?? new Date(),
          },
        });
      }
      return result;
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "job.update",
      entityType: "Job",
      entityId: job.id,
    });

    return NextResponse.json({ job: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
