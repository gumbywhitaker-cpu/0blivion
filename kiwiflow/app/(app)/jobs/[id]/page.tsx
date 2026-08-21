import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { JobStatusBadge, PriorityBadge } from "@/lib/ui/badges";
import { JobActions } from "./JobActions";
import { AssignDriverForm, UpdateEtaForm } from "./LogisticsActions";
import { MaturityTestForm } from "./MaturityTestForm";
import { SprayDiaryForm } from "./SprayDiaryForm";
import { BiosecurityInspectionForm } from "./BiosecurityInspectionForm";
import { BiosecurityRiskBadge } from "@/lib/ui/badges";
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
      orchard: {
        include: {
          biosecurityInspections: { orderBy: { inspectionDate: "desc" }, take: 10, include: { inspectedBy: true } },
        },
      },
      growerOrg: true,
      contractorOrg: true,
      crew: true,
      destinationOrg: true,
      assignedDriver: true,
      statusHistory: { orderBy: { changedAt: "asc" }, include: { changedBy: true } },
      invoiceItems: { include: { invoice: true } },
      maturityTests: { orderBy: { testDate: "desc" }, include: { recordedBy: true } },
      sprayEntries: { orderBy: { applicationDate: "desc" }, include: { applicator: true } },
      gradingResults: true,
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

  const isAssignedDriver = job.assignedDriverId === session.userId;
  const isContractorOrg = job.contractorOrgId !== null && session.organizationId === job.contractorOrgId;
  const drivers =
    job.jobType === "TRANSPORT" && isContractorOrg
      ? await prisma.user.findMany({ where: { organizationId: session.organizationId, role: "DRIVER" } })
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
            label: `${job.jobType} — ${job.orchard.name}`,
          }}
          session={session}
          contractors={contractors}
        />
      )}

      {job.jobType === "TRANSPORT" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-kf-charcoal">Logistics</h2>
          <dl className="grid grid-cols-1 gap-4 rounded-lg border border-kf-border bg-kf-card p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-kf-muted">Destination pack house</dt>
              <dd className="text-kf-charcoal">{job.destinationOrg?.name ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-kf-muted">Load</dt>
              <dd className="text-kf-charcoal">{job.loadDescription ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-kf-muted">Driver</dt>
              <dd className="text-kf-charcoal">{job.assignedDriver?.name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-kf-muted">ETA</dt>
              <dd className="text-kf-charcoal">
                {job.etaAt ? job.etaAt.toISOString().slice(0, 16).replace("T", " ") : "Not set"}
              </dd>
            </div>
          </dl>
          {isContractorOrg && !job.assignedDriver ? <AssignDriverForm jobId={job.id} drivers={drivers.map((d) => ({ id: d.id, name: d.name }))} /> : null}
          {isAssignedDriver && ["CONFIRMED", "IN_PROGRESS"].includes(job.status) ? (
            <UpdateEtaForm jobId={job.id} currentEta={job.etaAt ? job.etaAt.toISOString().slice(0, 16) : null} />
          ) : null}
        </section>
      ) : null}

      {job.jobType === "HARVEST" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-kf-charcoal">Maturity testing</h2>
          <MaturityTestForm jobId={job.id} orchardId={job.orchardId} />
          {job.maturityTests.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {job.maturityTests.map((t) => (
                <li
                  key={t.id}
                  className={`rounded-lg border p-3 text-sm ${
                    t.passed ? "border-kf-green-500 bg-kf-green-100" : "border-kf-red bg-kf-red/5"
                  }`}
                >
                  <span className="font-semibold text-kf-charcoal">{t.passed ? "PASS" : "FAIL"}</span>{" "}
                  {t.variety} · {t.brix.toFixed(1)}°Bx
                  {t.dryMatterPercent ? ` · ${t.dryMatterPercent.toFixed(1)}% DM` : ""}
                  {" "}(min {t.minBrixRequired?.toFixed(1)}°Bx
                  {t.minDryMatterRequired ? ` / ${t.minDryMatterRequired.toFixed(1)}% DM` : ""}) ·{" "}
                  {t.testDate.toISOString().slice(0, 10)} · {t.recordedBy.name}
                  {t.labOrTester ? ` · ${t.labOrTester}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {job.jobType === "SPRAY" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-kf-charcoal">Spray diary</h2>
          <SprayDiaryForm jobId={job.id} orchardId={job.orchardId} />
          {job.sprayEntries.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {job.sprayEntries.map((s) => (
                <li key={s.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
                  <span className="font-semibold text-kf-charcoal">{s.productName}</span>{" "}
                  {s.rateApplied} {s.rateUnit}
                  {s.areaTreatedHa ? ` over ${s.areaTreatedHa} ha` : ""} ·{" "}
                  {s.applicationDate.toISOString().slice(0, 10)}
                  {s.harvestSafeDate ? (
                    <> · safe to harvest from {s.harvestSafeDate.toISOString().slice(0, 10)}</>
                  ) : null}{" "}
                  · applied by {s.applicator.name}
                  {s.hsrNumber ? ` · HSR ${s.hsrNumber}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {job.jobType === "TRANSPORT" && job.gradingResults.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-kf-charcoal">Grading result</h2>
          {job.gradingResults.map((g) => (
            <div key={g.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
              <p className="text-kf-charcoal">
                {g.totalTrayEquivalents} tray equivalents
                {g.class1Percent != null ? ` · Class 1 ${g.class1Percent}%` : ""}
                {g.class2Percent != null ? ` · Class 2 ${g.class2Percent}%` : ""}
                {g.rejectPercent != null ? ` · Reject ${g.rejectPercent}%` : ""}
                {g.averageBrix != null ? ` · ${g.averageBrix}°Bx` : ""}
              </p>
              <p className="text-xs text-kf-muted">
                Graded {g.gradingDate.toISOString().slice(0, 10)} · manual entry, no sorter integration
              </p>
              {g.notes ? <p className="text-kf-muted">{g.notes}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-kf-charcoal">Biosecurity</h2>
        <BiosecurityInspectionForm jobId={job.id} orchardId={job.orchardId} />
        {job.orchard.biosecurityInspections.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {job.orchard.biosecurityInspections.map((b) => (
              <li key={b.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <BiosecurityRiskBadge riskLevel={b.riskLevel} />
                  <span className="font-semibold text-kf-charcoal">{b.category.replace("_", " ")}</span>
                  <span className="text-kf-muted">{b.inspectionDate.toISOString().slice(0, 10)}</span>
                </div>
                <p className="text-kf-charcoal">{b.findings}</p>
                {b.actionTaken ? <p className="text-kf-muted">Action: {b.actionTaken}</p> : null}
                {b.followUpRequired ? (
                  <p className="font-medium text-kf-gold">
                    Follow-up needed{b.followUpDate ? ` by ${b.followUpDate.toISOString().slice(0, 10)}` : ""}
                  </p>
                ) : null}
                <p className="text-xs text-kf-muted">Inspected by {b.inspectedBy.name}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

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
