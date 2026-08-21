import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { JobStatusBadge, PriorityBadge } from "@/lib/ui/badges";

export default async function JobsPage() {
  const session = await requireSession();

  const where =
    session.orgType === "GROWER"
      ? { growerOrgId: session.organizationId }
      : session.orgType === "CONTRACTOR"
        ? { contractorOrgId: session.organizationId }
        : { id: "__none__" };

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { scheduledDate: "desc" },
    include: { orchard: true, growerOrg: true, contractorOrg: true },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-kf-charcoal">Jobs</h1>
        <div className="flex gap-2">
          <a
            href="/api/v1/export/jobs.csv"
            className="btn rounded-md border border-kf-border px-4 py-2 text-sm font-medium text-kf-charcoal hover:border-kf-green-500"
          >
            Export CSV
          </a>
          {session.orgType === "GROWER" ? (
            <Link
              href="/jobs/new"
              className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
            >
              + New job
            </Link>
          ) : null}
        </div>
      </div>

      {jobs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          No jobs yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Orchard</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">
                  {session.orgType === "GROWER" ? "Contractor" : "Grower"}
                </th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-kf-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-kf-green-600 hover:underline">
                      {job.scheduledDate.toISOString().slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{job.orchard.name}</td>
                  <td className="px-4 py-3">{job.jobType}</td>
                  <td className="px-4 py-3">
                    {session.orgType === "GROWER"
                      ? (job.contractorOrg?.name ?? "Unassigned")
                      : job.growerOrg.name}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={job.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <JobStatusBadge status={job.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
