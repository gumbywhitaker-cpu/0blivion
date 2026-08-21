import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { JobStatusBadge } from "@/lib/ui/badges";

// Logistics Bridge, driver side (docs/BLUEPRINT.md: "Where am I going and
// what happens next?"). Gated on role, not orgType — a driver can belong to
// a CONTRACTOR or a dedicated TRANSPORT org, and this view is the same
// either way: only the TRANSPORT jobs assigned to *this* user.
export default async function DriverHubPage() {
  const session = await requireSession();
  if (session.role !== "DRIVER") redirect("/dashboard");

  const jobs = await prisma.job.findMany({
    where: {
      assignedDriverId: session.userId,
      // COMPLETE and INVOICED both mean "delivered" here — a job flips to
      // INVOICED almost immediately after COMPLETE (lib/invoicing.ts), which
      // has nothing to do with whether the driver has finished the run.
      status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETE", "INVOICED"] },
    },
    include: { orchard: true, growerOrg: true, destinationOrg: true },
    orderBy: [{ status: "asc" }, { scheduledDate: "asc" }],
  });

  const active = jobs.filter((j) => j.status === "CONFIRMED" || j.status === "IN_PROGRESS");
  const done = jobs.filter((j) => j.status === "COMPLETE" || j.status === "INVOICED").slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Deliveries</h1>
        <p className="text-kf-muted">Your assigned transport jobs &mdash; pickup, destination, and ETA.</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Where you&apos;re going</h2>
        {active.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            No deliveries assigned to you right now.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="btn flex items-center justify-between gap-4 rounded-lg border border-kf-border bg-kf-card p-4"
              >
                <div>
                  <p className="font-semibold text-kf-charcoal">
                    {job.orchard.name} → {job.destinationOrg?.name ?? "Destination not set"}
                  </p>
                  <p className="text-sm text-kf-muted">
                    {job.loadDescription ?? "Load not specified"} · {job.growerOrg.name}
                  </p>
                  <p className="text-sm text-kf-muted">
                    ETA {job.etaAt ? job.etaAt.toISOString().slice(0, 16).replace("T", " ") : "not set"}
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {done.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Recently delivered</h2>
          <div className="flex flex-col gap-3">
            {done.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="btn flex items-center justify-between gap-4 rounded-lg border border-kf-border bg-kf-card p-4 opacity-75"
              >
                <div>
                  <p className="font-semibold text-kf-charcoal">
                    {job.orchard.name} → {job.destinationOrg?.name ?? "Destination not set"}
                  </p>
                  <p className="text-sm text-kf-muted">{job.loadDescription ?? "Load not specified"}</p>
                </div>
                <JobStatusBadge status={job.status} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
