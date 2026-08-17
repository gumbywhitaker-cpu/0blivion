import { Suspense } from "react";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { JobsListClient } from "@/components/app/jobs/JobsListClient";

export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  const { business } = await requireBusiness();

  const [jobs, customers] = await Promise.all([
    prisma.job.findMany({ where: { businessId: business.id }, include: { customer: true }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
        <p className="mt-1 text-muted">{jobs.length} total</p>
      </div>
      <Suspense fallback={null}>
        <JobsListClient
          jobs={jobs.map((j) => ({
            id: j.id,
            jobNumber: j.jobNumber,
            title: j.title,
            status: j.status,
            quotedAmount: j.quotedAmount,
            actualRevenue: j.actualRevenue,
            customerName: j.customer.name,
          }))}
          customers={customers}
        />
      </Suspense>
    </div>
  );
}
