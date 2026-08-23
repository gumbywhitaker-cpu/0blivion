"use client";

import { useActionState } from "react";
import { createExportShipmentAction, type FormState } from "./actions";

export function CreateShipmentForm({
  unshippedLoadCount,
  transportOrgs,
}: {
  unshippedLoadCount: number;
  transportOrgs: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createExportShipmentAction, undefined);

  return (
    <div className="rounded-lg border border-kf-border bg-kf-card p-4">
      <p className="mb-3 text-sm text-kf-muted">
        {unshippedLoadCount} graded load{unshippedLoadCount === 1 ? "" : "s"} not yet on a shipment.
      </p>
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="mode" className="text-sm font-medium text-kf-charcoal">
            Mode
          </label>
          <select
            id="mode"
            name="mode"
            defaultValue="REEFER_VESSEL_PALLETS"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          >
            <option value="REEFER_VESSEL_PALLETS">Reefer vessel (pallets)</option>
            <option value="CONTAINER">Container</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="transportOrgId" className="text-sm font-medium text-kf-charcoal">
            Transport org (optional)
          </label>
          <select
            id="transportOrgId"
            name="transportOrgId"
            defaultValue=""
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          >
            <option value="">Not decided yet</option>
            {transportOrgs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        >
          {pending ? "Creating…" : "New shipment"}
        </button>
        {state?.error ? (
          <p className="w-full text-sm font-medium text-kf-red" role="alert">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
