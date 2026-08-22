import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { JobStatusBadge, BiosecurityRiskBadge, SafetySeverityBadge, CertificationStatusBadge } from "@/lib/ui/badges";
import { CertificationStatusForm } from "./CertificationStatusForm";

export default async function OrchardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const orchard = await prisma.orchard.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      jobs: { orderBy: { scheduledDate: "desc" }, take: 20 },
      biosecurityInspections: { orderBy: { inspectionDate: "desc" }, take: 10 },
      safetyIncidents: { orderBy: { incidentDate: "desc" }, take: 10 },
      certifications: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!orchard) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">{orchard.name}</h1>
        <p className="text-kf-muted">
          {orchard.region ?? "No region"} {orchard.hectares ? `· ${orchard.hectares} ha` : ""}
        </p>
        {orchard.address ? <p className="text-sm text-kf-muted">{orchard.address}</p> : null}
        {orchard.notes ? <p className="mt-2 max-w-xl text-sm text-kf-charcoal">{orchard.notes}</p> : null}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-kf-charcoal">Jobs at this orchard</h2>
        <Link
          href={`/jobs/new?orchardId=${orchard.id}`}
          className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
        >
          + New job
        </Link>
      </div>

      {orchard.jobs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          No jobs scheduled here yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orchard.jobs.map((job) => (
                <tr key={job.id} className="border-b border-kf-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="text-kf-green-600 hover:underline">
                      {job.scheduledDate.toISOString().slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{job.jobType}</td>
                  <td className="px-4 py-3">
                    <JobStatusBadge status={job.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orchard.biosecurityInspections.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-kf-charcoal">Biosecurity findings</h2>
            <Link href="/biosecurity" className="text-sm font-medium text-kf-green-600 hover:underline">
              View all orchards
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {orchard.biosecurityInspections.map((b) => (
              <li key={b.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <BiosecurityRiskBadge riskLevel={b.riskLevel} />
                  <span className="font-semibold text-kf-charcoal">{b.category.replace("_", " ")}</span>
                  <span className="text-kf-muted">{b.inspectionDate.toISOString().slice(0, 10)}</span>
                </div>
                <p className="text-kf-charcoal">{b.findings}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {orchard.safetyIncidents.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-kf-charcoal">Health &amp; safety reports</h2>
            <Link href="/safety" className="text-sm font-medium text-kf-green-600 hover:underline">
              View all orchards
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {orchard.safetyIncidents.map((s) => (
              <li key={s.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <SafetySeverityBadge severity={s.severity} />
                  <span className="font-semibold text-kf-charcoal">{s.type.replace("_", " ")}</span>
                  <span className="text-kf-muted">{s.incidentDate.toISOString().slice(0, 10)}</span>
                </div>
                <p className="text-kf-charcoal">{s.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-kf-charcoal">Certifications</h2>
          <Link href="/certifications" className="text-sm font-medium text-kf-green-600 hover:underline">
            Manage all orchards
          </Link>
        </div>
        {orchard.certifications.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-4 text-sm text-kf-muted">
            No certifications recorded for this orchard yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orchard.certifications.map((c) => (
              <li key={c.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <CertificationStatusBadge status={c.status} />
                  <span className="font-semibold text-kf-charcoal">{c.scheme}</span>
                  {c.certificateNumber ? <span className="text-kf-muted">#{c.certificateNumber}</span> : null}
                  {c.expiryDate ? (
                    <span className="text-kf-muted">expires {c.expiryDate.toISOString().slice(0, 10)}</span>
                  ) : null}
                </div>
                <CertificationStatusForm certificationId={c.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
