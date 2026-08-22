"use client";

import { useActionState, useState } from "react";
import { updateExportShipmentDetailsAction, type FormState } from "../actions";

type Defaults = {
  transportOrgId: string;
  palletCount: number | string;
  containerNumber: string;
  carrierBookingReference: string;
  shippingLine: string;
  vesselName: string;
  voyageNumber: string;
  destinationPort: string;
  reeferSetpointC: number | string;
  etd: string;
  phytosanitaryCertificateNumber: string;
  notes: string;
};

export function ShipmentDetailsForm({
  shipmentId,
  isPackhouse,
  defaults,
  needsTransportOrg,
  transportOrgs,
}: {
  shipmentId: string;
  isPackhouse: boolean;
  defaults: Defaults;
  needsTransportOrg: boolean;
  transportOrgs: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateExportShipmentDetailsAction, undefined);
  const [open, setOpen] = useState(needsTransportOrg);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-kf-green-600 underline">
        Edit details
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 text-sm">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {isPackhouse ? (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="transportOrgId" className="text-xs font-medium text-kf-charcoal">
              Transport org
            </label>
            <select
              id="transportOrgId"
              name="transportOrgId"
              defaultValue={defaults.transportOrgId}
              className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
            >
              <option value="">Not decided yet</option>
              {transportOrgs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="flex flex-col gap-1">
          <label htmlFor="palletCount" className="text-xs font-medium text-kf-charcoal">
            Pallets
          </label>
          <input
            id="palletCount"
            name="palletCount"
            type="number"
            min="0"
            defaultValue={defaults.palletCount}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="containerNumber" className="text-xs font-medium text-kf-charcoal">
            Container #
          </label>
          <input
            id="containerNumber"
            name="containerNumber"
            placeholder="e.g. MSCU1234567"
            defaultValue={defaults.containerNumber}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="carrierBookingReference" className="text-xs font-medium text-kf-charcoal">
            Booking reference
          </label>
          <input
            id="carrierBookingReference"
            name="carrierBookingReference"
            defaultValue={defaults.carrierBookingReference}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="shippingLine" className="text-xs font-medium text-kf-charcoal">
            Shipping line
          </label>
          <input
            id="shippingLine"
            name="shippingLine"
            defaultValue={defaults.shippingLine}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="vesselName" className="text-xs font-medium text-kf-charcoal">
            Vessel
          </label>
          <input
            id="vesselName"
            name="vesselName"
            defaultValue={defaults.vesselName}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="voyageNumber" className="text-xs font-medium text-kf-charcoal">
            Voyage #
          </label>
          <input
            id="voyageNumber"
            name="voyageNumber"
            defaultValue={defaults.voyageNumber}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="destinationPort" className="text-xs font-medium text-kf-charcoal">
            Destination port
          </label>
          <input
            id="destinationPort"
            name="destinationPort"
            placeholder="e.g. Shanghai, China"
            defaultValue={defaults.destinationPort}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="etd" className="text-xs font-medium text-kf-charcoal">
            ETD
          </label>
          <input
            id="etd"
            name="etd"
            type="date"
            defaultValue={defaults.etd}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reeferSetpointC" className="text-xs font-medium text-kf-charcoal">
            Reefer setpoint (°C)
          </label>
          <input
            id="reeferSetpointC"
            name="reeferSetpointC"
            type="number"
            step="0.5"
            defaultValue={defaults.reeferSetpointC}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="phytosanitaryCertificateNumber" className="text-xs font-medium text-kf-charcoal">
            Phytosanitary cert #
          </label>
          <input
            id="phytosanitaryCertificateNumber"
            name="phytosanitaryCertificateNumber"
            placeholder="MPI-issued reference"
            defaultValue={defaults.phytosanitaryCertificateNumber}
            className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-xs font-medium text-kf-charcoal">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaults.notes}
          className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm"
        />
      </div>
      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}
