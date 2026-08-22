import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ExportShipmentStatusBadge } from "@/lib/ui/badges";
import { EXPORT_SHIPMENT_TRANSITIONS, type ExportShipmentStatus } from "@/lib/types";
import { ShipmentDetailsForm } from "./ShipmentDetailsForm";
import { AttachLoadForm } from "./AttachLoadForm";
import { TransitionButtons } from "./TransitionButtons";

export default async function ExportShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const shipment = await prisma.exportShipment.findFirst({
    where: {
      id,
      OR: [{ packhouseOrgId: session.organizationId }, { transportOrgId: session.organizationId }],
    },
    include: {
      packhouseOrg: true,
      transportOrg: true,
      createdBy: true,
      gradingResults: { include: { job: { include: { orchard: true, growerOrg: true } } } },
      statusHistory: { orderBy: { changedAt: "asc" }, include: { changedBy: true } },
    },
  });
  if (!shipment) notFound();

  const isPackhouse = session.organizationId === shipment.packhouseOrgId;
  const isTransport = session.organizationId === shipment.transportOrgId;

  const unshippedLoads = isPackhouse
    ? await prisma.gradingResult.findMany({
        where: { organizationId: session.organizationId, exportShipmentId: null },
        include: { job: { include: { orchard: true, growerOrg: true } } },
        orderBy: { gradingDate: "desc" },
      })
    : [];

  const transportOrgs = isPackhouse
    ? await prisma.organization.findMany({ where: { type: "TRANSPORT" }, orderBy: { name: "asc" } })
    : [];

  const allowedNext = EXPORT_SHIPMENT_TRANSITIONS[shipment.status as ExportShipmentStatus] ?? [];
  const canTransition =
    (isPackhouse && allowedNext.includes("IN_TRANSIT_TO_WHARF")) ||
    (isTransport && allowedNext.some((s) => s !== "IN_TRANSIT_TO_WHARF"));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-kf-charcoal">
            {shipment.packhouseOrg.name} → {shipment.transportOrg?.name ?? "Transport org not set"}
          </h1>
          <p className="text-kf-muted">
            {shipment.mode === "CONTAINER" ? "Container" : "Reefer vessel (pallets)"} · Created{" "}
            {shipment.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
        <ExportShipmentStatusBadge status={shipment.status} />
      </div>

      {canTransition ? (
        <TransitionButtons shipmentId={shipment.id} allowedNext={allowedNext} isPackhouse={isPackhouse} />
      ) : null}

      <section className="rounded-lg border border-kf-border bg-kf-card p-4">
        <h2 className="mb-3 font-semibold text-kf-charcoal">Shipment details</h2>
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-kf-muted">Pallets</p>
            <p>{shipment.palletCount ?? "Not set"}</p>
          </div>
          {shipment.mode === "CONTAINER" ? (
            <div>
              <p className="text-xs uppercase text-kf-muted">Container</p>
              <p>{shipment.containerNumber ?? "Not assigned"}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase text-kf-muted">Shipping line</p>
            <p>{shipment.shippingLine ?? "Not set"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-kf-muted">Vessel</p>
            <p>
              {shipment.vesselName ?? "Not set"}
              {shipment.voyageNumber ? ` · Voy ${shipment.voyageNumber}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-kf-muted">Destination port</p>
            <p>{shipment.destinationPort ?? "Not set"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-kf-muted">ETD</p>
            <p>{shipment.etd ? shipment.etd.toISOString().slice(0, 10) : "Not set"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-kf-muted">Reefer setpoint</p>
            <p>{shipment.reeferSetpointC != null ? `${shipment.reeferSetpointC}°C` : "Not set"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-kf-muted">Phytosanitary cert #</p>
            <p>{shipment.phytosanitaryCertificateNumber ?? "Not set"}</p>
          </div>
        </div>
        {isPackhouse || isTransport ? (
          <ShipmentDetailsForm
            shipmentId={shipment.id}
            isPackhouse={isPackhouse}
            defaults={{
              transportOrgId: shipment.transportOrgId ?? "",
              palletCount: shipment.palletCount ?? "",
              containerNumber: shipment.containerNumber ?? "",
              carrierBookingReference: shipment.carrierBookingReference ?? "",
              shippingLine: shipment.shippingLine ?? "",
              vesselName: shipment.vesselName ?? "",
              voyageNumber: shipment.voyageNumber ?? "",
              destinationPort: shipment.destinationPort ?? "",
              reeferSetpointC: shipment.reeferSetpointC ?? "",
              etd: shipment.etd ? shipment.etd.toISOString().slice(0, 10) : "",
              phytosanitaryCertificateNumber: shipment.phytosanitaryCertificateNumber ?? "",
              notes: shipment.notes ?? "",
            }}
            needsTransportOrg={!shipment.transportOrgId}
            transportOrgs={transportOrgs.map((t) => ({ id: t.id, name: t.name }))}
          />
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">
          Loads on this shipment ({shipment.gradingResults.length})
        </h2>
        {shipment.gradingResults.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-4 text-sm text-kf-muted">
            No loads attached yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shipment.gradingResults.map((g) => (
              <li key={g.id} className="rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
                <span className="font-medium text-kf-charcoal">
                  {g.job.orchard.name} ({g.job.growerOrg.name})
                </span>{" "}
                — {g.totalTrayEquivalents} TE
                {g.averageBrix != null ? ` · ${g.averageBrix}°Bx` : ""}
              </li>
            ))}
          </ul>
        )}
        {isPackhouse && unshippedLoads.length > 0 ? (
          <AttachLoadForm shipmentId={shipment.id} loads={unshippedLoads} />
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">History</h2>
        <ul className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-4 text-sm">
          {shipment.statusHistory.map((h) => (
            <li key={h.id} className="flex justify-between gap-4 text-kf-muted">
              <span>
                {h.fromStatus ? `${h.fromStatus} → ` : ""}
                <span className="font-medium text-kf-charcoal">{h.toStatus}</span>
                {h.changedBy ? ` by ${h.changedBy.name}` : ""}
              </span>
              <span>{h.changedAt.toISOString().slice(0, 16).replace("T", " ")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
