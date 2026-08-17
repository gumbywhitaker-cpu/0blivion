import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { JobDetailClient } from "@/components/app/jobs/JobDetailClient";

export default async function JobDetailPage(ctx: PageProps<"/app/jobs/[id]">) {
  const { id } = await ctx.params;
  const { business } = await requireBusiness();

  const job = await prisma.job.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, invoices: true },
  });
  if (!job) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <JobDetailClient job={job} />
    </div>
  );
}
