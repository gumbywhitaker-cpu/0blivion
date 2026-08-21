import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { JobStatusBadge, PriorityBadge } from "@/lib/ui/badges";
import { JobActions } from "./JobActions";
import type { JobStatus } from "@/lib/types";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: {
      id,
      OR: [{ growerOrgId: session.organizationId }, { contractorOrgId: session.organizationId }],
    },
    include: {
      orchard: true,
      growerOrg: true,
      contractorOrg: true,
      crew: true,
      statusHistory: { orderBy: { changedAt: "asc" }, include: { changedBy: true } },
      invoiceItems: { include: { invoice: true } },
    },
  });
  if (!job) notFound();

  const contractors =
    session.orgType === "GROWER"
      ? (
          await prisma.contractorLink.findMany({
            where: { growerOrgId: session.organizationId, status: "ACTIVE" },
            include: { contractorOrg: true },
          })
        ).map((l) => ({ id: l.contractorOrgId, name: l.contractorOrg.name }))
      : [];

  const invoice = job.invoiceItems[0]?.invoice;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-kf-charcoal">
            {job.jobType} — {job.orchard.name}
          </h1>
          <p className="text-kf-muted">
            {job.scheduledDate.toISOString().slice(0, 10)}
            {job.startTime ? ` at ${job.startTime}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <PriorityBadge priority={job.priority} />
          <JobStatusBadge status={job.status} />
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-kf-border bg-kf-card p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase text-kf-muted">Grower</dt>
          <dd className="text-kf-charcoal">{job.growerOrg.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-kf-muted">Contractor</dt>
          <dd className="text-kf-charcoal">{job.contractorOrg?.name ?? "Unassigned"}</dd>
        </div>
        {job.rate ? (
          <div>
            <dt className="text-xs uppercase text-kf-muted">Rate</dt>
            <dd className="text-kf-charcoal">
              ${job.rate.toFixed(2)} per {job.unit ?? "unit"}
            </dd>
          </div>
        ) : null}
        {job.quantity ? (
          <div>
            <dt className="text-xs uppercase text-kf-muted">Quantity completed</dt>
            <dd className="text-kf-charcoal">
              {job.quantity} {job.unit ?? ""}
            </dd>
          </div>
        ) : null}
        {job.instructions ? (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-kf-muted">Instructions</dt>
            <dd className="text-kf-charcoal">{job.instructions}</dd>
          </div>
        ) : null}
      </dl>

      {invoice ? (
        <p className="rounded-lg bg-kf-green-100 px-4 py-3 text-sm text-kf-green-700">
          Invoiced as{" "}
          <Link href={`/invoices/${invoice.id}`} className="font-semibold underline">
            {invoice.invoiceNumber}
          </Link>{" "}
          — ${invoice.total.toFixed(2)}
        </p>
      ) : (
        <JobActions
          job={{
            id: job.id,
            status: job.status as JobStatus,
            growerOrgId: job.growerOrgId,
            contractorOrgId: job.contractorOrgId,
            unit: job.unit,
          }}
          session={session}
          contractors={contractors}
        />
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">History</h2>
        <ul className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-4 text-sm">
          {job.statusHistory.map((h) => (
            <li key={h.id} className="flex justify-between gap-4 text-kf-muted">
              <span>
                {h.fromStatus ? `${h.fromStatus} → ` : ""}
                <span className="font-medium text-kf-charcoal">{h.toStatus}</span>
                {h.changedBy ? ` by ${h.changedBy.name}` : " (automatic)"}
                {h.note ? ` — ${h.note}` : ""}
              </span>
              <span className="shrink-0">{h.changedAt.toISOString().slice(0, 16).replace("T", " ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
