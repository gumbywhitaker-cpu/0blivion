import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ExportShipmentStatusBadge } from "@/lib/ui/badges";
import { CreateShipmentForm } from "./CreateShipmentForm";

// The export leg (docs/BLUEPRINT.md's Logistics Bridge, extended): pack
// house -> a TRANSPORT org's own wharf coolstore -> loaded for export,
// palletised on a reefer vessel or packed into containers. Pack houses
// create and manage shipments here; transport orgs see the shipments
// assigned to them and work the wharf-side steps.
export default async function ExportPage() {
  const session = await requireSession();
  if (!["PACKHOUSE", "TRANSPORT"].includes(session.orgType)) redirect("/dashboard");

  const shipments = await prisma.exportShipment.findMany({
    where:
      session.orgType === "PACKHOUSE"
        ? { packhouseOrgId: session.organizationId }
        : { transportOrgId: session.organizationId },
    include: { packhouseOrg: true, transportOrg: true, gradingResults: true },
    orderBy: { createdAt: "desc" },
  });

  const unshippedLoads =
    session.orgType === "PACKHOUSE"
      ? await prisma.gradingResult.findMany({
          where: { organizationId: session.organizationId, exportShipmentId: null },
          include: { job: { include: { orchard: true, growerOrg: true } } },
          orderBy: { gradingDate: "desc" },
        })
      : [];

  const transportOrgs =
    session.orgType === "PACKHOUSE"
      ? await prisma.organization.findMany({ where: { type: "TRANSPORT" }, orderBy: { name: "asc" } })
      : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Export shipments</h1>
        <p className="text-kf-muted">
          {session.orgType === "PACKHOUSE"
            ? "Consolidate graded loads into shipments and track them to the wharf."
            : "Shipments assigned to your organisation — from wharf arrival to vessel departure."}
        </p>
      </div>

      {session.orgType === "PACKHOUSE" ? (
        <CreateShipmentForm
          unshippedLoadCount={unshippedLoads.length}
          transportOrgs={transportOrgs.map((t) => ({ id: t.id, name: t.name }))}
        />
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Shipments</h2>
        {shipments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            No shipments yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {shipments.map((s) => (
              <Link
                key={s.id}
                href={`/export/${s.id}`}
                className="btn flex flex-wrap items-center justify-between gap-3 rounded-lg border border-kf-border bg-kf-card p-4"
              >
                <div>
                  <p className="font-semibold text-kf-charcoal">
                    {s.packhouseOrg.name} → {s.transportOrg?.name ?? "Transport org not set"}
                  </p>
                  <p className="text-sm text-kf-muted">
                    {s.gradingResults.length} load{s.gradingResults.length === 1 ? "" : "s"} ·{" "}
                    {s.mode === "CONTAINER" ? "Container" : "Reefer vessel (pallets)"}
                    {s.vesselName ? ` · ${s.vesselName}` : ""}
                  </p>
                </div>
                <ExportShipmentStatusBadge status={s.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
