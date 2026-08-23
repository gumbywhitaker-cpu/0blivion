import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { JobStatusBadge } from "@/lib/ui/badges";
import { JOB_STATUSES } from "@/lib/types";
import { WeatherPanel } from "./WeatherPanel";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function GrowerCommandCenterPage() {
  const session = await requireSession();
  if (session.orgType !== "GROWER") redirect("/dashboard");

  const orgId = session.organizationId;
  const monthStart = startOfMonth();

  const [statusCounts, committedAgg, outstandingAgg, paidAgg, upcomingJobs, recentNotifications, contractorCount, firstOrchard] =
    await Promise.all([
      prisma.job.groupBy({ by: ["status"], where: { growerOrgId: orgId }, _count: { _all: true } }),
      prisma.invoice.aggregate({
        where: { toOrgId: orgId, createdAt: { gte: monthStart } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { toOrgId: orgId, status: { in: ["SENT", "OVERDUE"] } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { toOrgId: orgId, status: "PAID", paidAt: { gte: monthStart } },
        _sum: { total: true },
      }),
      prisma.job.findMany({
        where: { growerOrgId: orgId, status: { in: ["NEW", "SCHEDULED", "CONFIRMED", "IN_PROGRESS"] } },
        include: { orchard: true, contractorOrg: true },
        orderBy: { scheduledDate: "asc" },
        take: 8,
      }),
      prisma.notification.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.contractorLink.count({ where: { growerOrgId: orgId, status: "ACTIVE" } }),
      prisma.orchard.findFirst({
        where: { organizationId: orgId, region: { not: null } },
        select: { region: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Command Center</h1>
        <p className="text-kf-muted">What&apos;s happening across your operation.</p>
      </div>

      {/* These figures are click-through auditable: every dollar traces to an
          Invoice row, not an opaque "recovered revenue" score (see docs/BLUEPRINT.md
          Section 0.1). A grower being billed doesn't have "revenue" here — this is
          committed spend, so it's labelled as such. */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Committed this month" value={committedAgg._sum.total ?? 0} />
        <StatTile label="Outstanding to pay" value={outstandingAgg._sum.total ?? 0} accent="gold" />
        <StatTile label="Paid this month" value={paidAgg._sum.total ?? 0} accent="green" />
      </section>

      <WeatherPanel region={firstOrchard?.region ?? null} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Job pipeline</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {JOB_STATUSES.map((status) => (
            <div key={status} className="rounded-lg border border-kf-border bg-kf-card p-3 text-center">
              <p className="text-2xl font-semibold text-kf-charcoal">{countByStatus[status] ?? 0}</p>
              <div className="mt-1 flex justify-center">
                <JobStatusBadge status={status} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-kf-charcoal">Active jobs</h2>
            <Link href="/jobs" className="text-sm font-medium text-kf-green-600 underline">
              View all
            </Link>
          </div>
          {upcomingJobs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
              No active jobs right now.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcomingJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="btn flex items-center justify-between rounded-lg border border-kf-border bg-kf-card p-3 hover:border-kf-green-500"
                  >
                    <span>
                      <span className="font-medium text-kf-charcoal">{job.orchard.name}</span>{" "}
                      <span className="text-kf-muted">— {job.jobType}</span>
                      <br />
                      <span className="text-xs text-kf-muted">
                        {job.contractorOrg?.name ?? "Unassigned"} ·{" "}
                        {job.scheduledDate.toISOString().slice(0, 10)}
                      </span>
                    </span>
                    <JobStatusBadge status={job.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-kf-charcoal">Recent alerts</h2>
            <Link href="/notifications" className="text-sm font-medium text-kf-green-600 underline">
              View all
            </Link>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
              Nothing new.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentNotifications.map((n) => (
                <li key={n.id} className="rounded-lg border border-kf-border bg-kf-card p-3">
                  <p className="font-medium text-kf-charcoal">{n.title}</p>
                  <p className="text-sm text-kf-muted">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-sm text-kf-muted">
        {contractorCount} active contractor{contractorCount === 1 ? "" : "s"} linked. Waiting-time cost
        avoided isn&apos;t shown yet — that figure needs the Logistics Bridge to measure real waiting
        time, which hasn&apos;t shipped (see roadmap).
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "gold" | "green";
}) {
  const accentClass =
    accent === "gold" ? "text-kf-gold" : accent === "green" ? "text-kf-green-600" : "text-kf-charcoal";
  return (
    <div className="rounded-lg border border-kf-border bg-kf-card p-5">
      <p className="text-sm text-kf-muted">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${accentClass}`}>
        ${value.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}
