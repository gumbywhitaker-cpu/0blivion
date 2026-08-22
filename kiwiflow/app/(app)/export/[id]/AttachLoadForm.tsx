"use client";

import { useActionState } from "react";
import { attachGradingResultAction, type FormState } from "../actions";

type Load = {
  id: string;
  totalTrayEquivalents: number;
  job: { orchard: { name: string }; growerOrg: { name: string } };
};

export function AttachLoadForm({ shipmentId, loads }: { shipmentId: string; loads: Load[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(attachGradingResultAction, undefined);

  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-kf-border bg-kf-card p-4">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <div className="flex flex-col gap-1">
        <label htmlFor="gradingResultId" className="text-sm font-medium text-kf-charcoal">
          Add a graded load
        </label>
        <select
          id="gradingResultId"
          name="gradingResultId"
          required
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          {loads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.job.orchard.name} ({l.job.growerOrg.name}) — {l.totalTrayEquivalents} TE
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to shipment"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
