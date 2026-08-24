import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/db";
import { getOrCreateModularPipeConfig } from "@/lib/modularPipe/config";
import { PACK_VERSION } from "@/lib/modularPipe/types";
import { ConfigForm } from "./ConfigForm";

// God Mode admin panel (spec Section 4) — pack management, validation rule config, and
// an observability summary, scoped to this PACKHOUSE org's own Data Bridge instance
// (docs/BLUEPRINT.md's tenant model: each org runs its own pipe, no cross-org pooling).
export default async function ModularPipeDashboardPage() {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") redirect("/dashboard");

  const [config, statusCounts, issueCodeCounts, recentDocs] = await Promise.all([
    getOrCreateModularPipeConfig(session.organizationId),
    prisma.modularPipeDocument.groupBy({
      by: ["status"],
      where: { organizationId: session.organizationId },
      _count: { _all: true },
    }),
    prisma.modularPipeIssue.groupBy({
      by: ["code"],
      where: { organizationId: session.organizationId, resolved: false },
      _count: { _all: true },
      orderBy: { _count: { code: "desc" } },
      take: 5,
    }),
    prisma.modularPipeDocument.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { timestampReceived: "desc" },
      take: 5,
    }),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));
  const totalDocs = statusCounts.reduce((sum, s) => sum + s._count._all, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-kf-charcoal">Data Bridge — God Mode</h1>
          <p className="text-kf-muted">
            Modular AI Data Bridge, {PACK_VERSION}. Turns messy quality logs, bin origin records, and RSE
            timesheets into validated, analytics-ready data — nothing here guesses on business-critical fields.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/packhouse/modular-pipe/ingest" className="btn rounded-md bg-kf-green-700 px-4 py-2 text-sm font-medium text-white">
            Ingest a document
          </Link>
          <Link href="/packhouse/modular-pipe/queue" className="btn rounded-md border border-kf-border bg-white px-4 py-2 text-sm font-medium text-kf-charcoal">
            Open exception queue
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Observability</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile label="Documents processed" value={totalDocs} />
          <StatTile label="Valid" value={countByStatus.valid ?? 0} />
          <StatTile label="Valid w/ warnings" value={countByStatus.valid_with_warnings ?? 0} />
          <StatTile label="Invalid" value={countByStatus.invalid ?? 0} />
          <StatTile label="Unclassified" value={countByStatus.unclassified ?? 0} />
        </div>
      </section>

      {issueCodeCounts.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Top recurring error codes (open)</h2>
          <div className="flex flex-wrap gap-2">
            {issueCodeCounts.map((c) => (
              <span key={c.code} className="rounded-full border border-kf-border bg-kf-card px-3 py-1 text-sm">
                <span className="font-mono text-xs">{c.code}</span> · {c._count._all}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Validation rule configuration</h2>
        <ConfigForm config={config} canManage={canManage(session.role)} />
      </section>

      {recentDocs.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Recently ingested</h2>
          <ul className="flex flex-col gap-2">
            {recentDocs.map((d) => (
              <li key={d.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
                <Link href={`/packhouse/modular-pipe/documents/${d.id}`} className="font-medium text-kf-charcoal hover:underline">
                  {d.sourceTypeFinal ?? d.sourceTypeProvisional} — {d.originalFilename ?? "(pasted text)"}
                </Link>
                <span className="ml-2 text-xs text-kf-muted">{d.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-kf-border bg-kf-card p-4">
      <p className="text-xs text-kf-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-kf-charcoal">{value}</p>
    </div>
  );
}
