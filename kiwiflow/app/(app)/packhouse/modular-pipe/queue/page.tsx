import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ModularPipeStatusBadge } from "@/lib/ui/badges";
import { DOCUMENT_STATUSES, SOURCE_TYPES } from "@/lib/modularPipe/types";

// God Mode's exception queue (spec Section 4.3): unclassified_docs, needs_review, and
// conflicts, filterable by status/source type/severity, all in one table — a document
// with any open error is inherently "needs review" or "conflicts", so a single filtered
// list stands in for the spec's three named queues rather than three separate pages.
export default async function ModularPipeQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sourceType?: string; severity?: string }>;
}) {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") redirect("/dashboard");

  const { status, sourceType, severity } = await searchParams;

  const documents = await prisma.modularPipeDocument.findMany({
    where: {
      organizationId: session.organizationId,
      ...(status ? { status } : {}),
      ...(sourceType ? { sourceTypeFinal: sourceType } : {}),
      ...(severity ? { issues: { some: { severity, resolved: false } } } : {}),
    },
    include: { _count: { select: { issues: { where: { resolved: false } } } } },
    orderBy: { timestampReceived: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Data Bridge — exception queue</h1>
        <p className="text-kf-muted">Unclassified documents, validation errors, and cross-record conflicts.</p>
      </div>

      <form className="flex flex-wrap gap-3 rounded-lg border border-kf-border bg-kf-card p-3 text-sm" method="get">
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-kf-border bg-white px-2 py-1.5">
          <option value="">All statuses</option>
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select name="sourceType" defaultValue={sourceType ?? ""} className="rounded-md border border-kf-border bg-white px-2 py-1.5">
          <option value="">All document types</option>
          {SOURCE_TYPES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select name="severity" defaultValue={severity ?? ""} className="rounded-md border border-kf-border bg-white px-2 py-1.5">
          <option value="">Any severity</option>
          <option value="error">Has open errors</option>
          <option value="warning">Has open warnings</option>
        </select>
        <button type="submit" className="btn rounded-md border border-kf-border bg-white px-3 py-1.5 font-medium text-kf-charcoal">
          Filter
        </button>
      </form>

      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          Nothing matches this filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Open issues</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-kf-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/packhouse/modular-pipe/documents/${d.id}`} className="font-medium text-kf-charcoal hover:underline">
                      {d.originalFilename ?? "(pasted text)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{d.sourceTypeFinal ?? d.sourceTypeProvisional}</td>
                  <td className="px-4 py-3">
                    <ModularPipeStatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">{d._count.issues}</td>
                  <td className="px-4 py-3 text-kf-muted">{d.timestampReceived.toISOString().slice(0, 16).replace("T", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
