import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { JobStatusBadge, PriorityBadge } from "@/lib/ui/badges";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export default async function ContractorHubPage() {
  const session = await requireSession();
  if (session.orgType !== "CONTRACTOR") redirect("/dashboard");

  const today = new Date();

  const [needsConfirmation, todaysJobs, upcomingJobs] = await Promise.all([
    prisma.job.findMany({
      where: { contractorOrgId: session.organizationId, status: "SCHEDULED" },
      include: { orchard: true, growerOrg: true },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.job.findMany({
      where: {
        contractorOrgId: session.organizationId,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        scheduledDate: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      include: { orchard: true, growerOrg: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.job.findMany({
      where: {
        contractorOrgId: session.organizationId,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        scheduledDate: { gt: endOfDay(today) },
      },
      include: { orchard: true, growerOrg: true },
      orderBy: { scheduledDate: "asc" },
      take: 20,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-kf-charcoal">Contractor Hub</h1>

      {needsConfirmation.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-gold">Needs your response</h2>
          <div className="flex flex-col gap-3">
            {needsConfirmation.map((job) => (
              <JobCard key={job.id} job={job} highlight />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Today</h2>
        {todaysJobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            Nothing on today.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {todaysJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Upcoming</h2>
        {upcomingJobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            Nothing else scheduled.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function JobCard({
  job,
  highlight,
}: {
  job: {
    id: string;
    jobType: string;
    status: string;
    priority: string;
    scheduledDate: Date;
    startTime: string | null;
    orchard: { name: string };
    growerOrg: { name: string };
  };
  highlight?: boolean;
}) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`btn flex items-center justify-between gap-4 rounded-lg border p-4 ${
        highlight ? "border-kf-gold bg-kf-gold/10" : "border-kf-border bg-kf-card"
      }`}
    >
      <div>
        <p className="font-semibold text-kf-charcoal">
          {job.jobType} — {job.orchard.name}
        </p>
        <p className="text-sm text-kf-muted">
          {job.growerOrg.name} · {job.scheduledDate.toISOString().slice(0, 10)}
          {job.startTime ? ` at ${job.startTime}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <PriorityBadge priority={job.priority} />
        <JobStatusBadge status={job.status} />
      </div>
    </Link>
  );
}
