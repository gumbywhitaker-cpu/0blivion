import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/db";
import { ModularPipeStatusBadge, ModularPipeIssueSeverityBadge } from "@/lib/ui/badges";
import { ResolveIssueForm } from "../../ResolveIssueForm";

// Side-by-side detail view (spec Section 4.3): original document content, extracted
// fields, and error reasons together, so an admin resolving a conflict never has to
// take the pipeline's word for it without seeing what it actually read.
export default async function ModularPipeDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") redirect("/dashboard");
  const { id } = await params;

  const doc = await prisma.modularPipeDocument.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      qualityLogs: true,
      binOrigins: true,
      rseTimesheets: true,
      issues: { orderBy: [{ resolved: "asc" }, { severity: "desc" }, { createdAt: "asc" }] },
      operator: { select: { name: true } },
    },
  });
  if (!doc) notFound();

  const canResolve = canManage(session.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-kf-charcoal">
            {doc.sourceTypeFinal ?? doc.sourceTypeProvisional} — {doc.originalFilename ?? "(pasted text)"}
          </h1>
          <p className="text-kf-muted text-sm">
            Received {doc.timestampReceived.toISOString().slice(0, 16).replace("T", " ")} via {doc.channel}
            {doc.operator ? ` by ${doc.operator.name}` : ""}
          </p>
        </div>
        <ModularPipeStatusBadge status={doc.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Original document</h2>
          <div className="rounded-lg border border-kf-border bg-kf-card p-4">
            {doc.rawText ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs">{doc.rawText}</pre>
            ) : doc.imageNote ? (
              <p className="text-sm text-kf-muted">{doc.imageNote} — the photo itself isn&apos;t retained by KiwiFlow.</p>
            ) : (
              <p className="text-sm text-kf-muted">No content recorded.</p>
            )}
            {doc.classificationReason ? (
              <p className="mt-3 text-xs text-kf-muted">Classification note: {doc.classificationReason}</p>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Extracted fields</h2>
          <div className="flex flex-col gap-3">
            {doc.qualityLogs.map((r) => (
              <div key={r.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-xs">
                <p className="mb-1 font-semibold text-kf-charcoal">Quality log</p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <Field label="Date/time" value={[r.date, r.time].filter(Boolean).join(" ") || null} />
                  <Field label="Block" value={r.blockIdRaw} />
                  <Field label="Bin IDs" value={JSON.parse(r.binIdsRawJson).join(", ") || null} />
                  <Field label="Variety / Grade" value={[r.variety, r.grade].filter(Boolean).join(" / ") || null} />
                  <Field label="Inspector" value={r.inspectorIdRaw} />
                  <Field label="Linked load" value={r.linkedLoadIdRaw} />
                </dl>
              </div>
            ))}
            {doc.binOrigins.map((r) => (
              <div key={r.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-xs">
                <p className="mb-1 font-semibold text-kf-charcoal">Bin origin</p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <Field label="Bin ID" value={r.binIdRaw} />
                  <Field label="Harvest date" value={r.harvestDate} />
                  <Field label="Orchard / Block" value={[r.orchardIdRaw, r.blockIdRaw].filter(Boolean).join(" / ") || null} />
                  <Field label="Variety" value={r.variety} />
                  <Field label="Load" value={r.loadIdRaw} />
                  <Field label="Destination" value={r.destinationSiteIdRaw} />
                </dl>
              </div>
            ))}
            {doc.rseTimesheets.map((r) => (
              <div key={r.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-xs">
                <p className="mb-1 font-semibold text-kf-charcoal">RSE timesheet</p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <Field label="Worker" value={r.workerNameRaw ?? r.workerIdRaw} />
                  <Field label="Date" value={r.date} />
                  <Field label="Shift" value={[r.shiftStartTime, r.shiftEndTime].filter(Boolean).join("–") || null} />
                  <Field label="Hours (reported)" value={r.totalHoursReported?.toString() ?? null} />
                  <Field label="Hours (computed)" value={r.totalHoursComputed?.toString() ?? null} />
                  <Field label="Pay rate" value={r.payRate !== null ? `$${r.payRate}` : null} />
                </dl>
              </div>
            ))}
            {doc.qualityLogs.length === 0 && doc.binOrigins.length === 0 && doc.rseTimesheets.length === 0 ? (
              <p className="text-sm text-kf-muted">No records were extracted from this document.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Issues ({doc.issues.filter((i) => !i.resolved).length} open)</h2>
        {doc.issues.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">No issues recorded.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {doc.issues.map((issue) => (
              <li key={issue.id} className={`rounded-lg border border-kf-border bg-kf-card p-3 text-sm ${issue.resolved ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2">
                  <ModularPipeIssueSeverityBadge severity={issue.severity} />
                  <span className="font-mono text-xs text-kf-muted">{issue.code}</span>
                  {issue.resolved ? <span className="text-xs text-kf-green-700">resolved</span> : null}
                </div>
                <p className="mt-1">{issue.message}</p>
                {issue.suggestedAction ? <p className="mt-1 text-xs text-kf-muted">Suggested: {issue.suggestedAction}</p> : null}
                {issue.resolved ? (
                  issue.resolutionNote ? <p className="mt-1 text-xs text-kf-muted">Note: {issue.resolutionNote}</p> : null
                ) : canResolve ? (
                  <ResolveIssueForm issueId={issue.id} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="text-kf-muted">{label}</dt>
      <dd className="text-kf-charcoal">{value ?? <span className="italic text-kf-muted">null (flagged)</span>}</dd>
    </>
  );
}
