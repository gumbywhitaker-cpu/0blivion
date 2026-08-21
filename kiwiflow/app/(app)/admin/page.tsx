import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

// Deliberately read-only and deliberately shallow for v1: a cross-org overview,
// not a parallel admin UI for every existing feature page. See docs/BLUEPRINT.md
// Section 23 for the scope note and why this stays narrow.
export default async function AdminOverviewPage() {
  const session = await requireSession();
  // A soft redirect, not a thrown error, matching how every other org-gated page
  // in this app handles the wrong org type (e.g. app/(app)/grower/page.tsx) —
  // the security boundary is the same either way, this just avoids a raw error
  // page for a non-admin who lands here.
  if (!isAdmin(session.orgType)) redirect("/dashboard");

  // This is the one deliberate bypass of tenant isolation in the app — every
  // view of it is logged, same as any other privileged cross-org access.
  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "admin.overview_viewed",
    entityType: "AdminOverview",
    entityId: "all-organizations",
  });

  const [orgs, jobCounts, invoiceAgg, userCount, auditLog] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true, orchards: true, jobsAsGrower: true, jobsAsContractor: true } } },
    }),
    prisma.job.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.invoice.aggregate({ _sum: { total: true }, _count: { _all: true } }),
    prisma.user.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { name: true, email: true } }, organization: { select: { name: true } } },
    }),
  ]);

  const countByStatus = Object.fromEntries(jobCounts.map((s) => [s.status, s._count._all]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Platform Admin</h1>
        <p className="text-kf-muted">
          Cross-organization overview. This account bypasses the tenant isolation every
          other role is subject to — read-only for now.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatTile label="Organizations" value={orgs.length} />
        <StatTile label="Users" value={userCount} />
        <StatTile label="Invoices" value={invoiceAgg._count._all} />
        <StatTile
          label="Invoiced total"
          value={`$${(invoiceAgg._sum.total ?? 0).toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Jobs by status (all orgs)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {["NEW", "SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETE", "INVOICED", "CANCELLED"].map((status) => (
            <div key={status} className="rounded-lg border border-kf-border bg-kf-card p-3 text-center">
              <p className="text-2xl font-semibold text-kf-charcoal">{countByStatus[status] ?? 0}</p>
              <p className="mt-1 text-xs uppercase text-kf-muted">{status}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Organizations</h2>
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Orchards</th>
                <th className="px-4 py-3">Jobs (grower)</th>
                <th className="px-4 py-3">Jobs (contractor)</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-b border-kf-border last:border-0">
                  <td className="px-4 py-3 font-medium text-kf-charcoal">{org.name}</td>
                  <td className="px-4 py-3">{org.type}</td>
                  <td className="px-4 py-3">{org.region ?? "—"}</td>
                  <td className="px-4 py-3">{org._count.users}</td>
                  <td className="px-4 py-3">{org._count.orchards}</td>
                  <td className="px-4 py-3">{org._count.jobsAsGrower}</td>
                  <td className="px-4 py-3">{org._count.jobsAsContractor}</td>
                  <td className="px-4 py-3">{org.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Security activity (all orgs)</h2>
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Organisation</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Entity</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => (
                <tr key={entry.id} className="border-b border-kf-border last:border-0">
                  <td className="px-4 py-3 text-kf-muted">
                    {entry.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-4 py-3">{entry.organization.name}</td>
                  <td className="px-4 py-3">{entry.actor?.name ?? entry.actor?.email ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                  <td className="px-4 py-3 text-kf-muted">
                    {entry.entityType}:{entry.entityId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-kf-border bg-kf-card p-5">
      <p className="text-sm text-kf-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-kf-charcoal">{value}</p>
    </div>
  );
}
