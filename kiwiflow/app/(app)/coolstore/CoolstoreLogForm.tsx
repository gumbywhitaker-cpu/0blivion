"use client";

import { useActionState } from "react";
import { recordCoolstoreLogAction, type FormState } from "../jobs/[id]/complianceActions";

export function CoolstoreLogForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(recordCoolstoreLogAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border border-kf-border bg-kf-card p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="facilityName" className="text-sm font-medium text-kf-charcoal">Facility / room</label>
        <input
          id="facilityName"
          name="facilityName"
          required
          placeholder="e.g. Coolstore 2"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="temperatureC" className="text-sm font-medium text-kf-charcoal">Temperature (°C)</label>
        <input
          id="temperatureC"
          name="temperatureC"
          type="number"
          step="0.1"
          required
          className="w-28 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="humidityPercent" className="text-sm font-medium text-kf-charcoal">Humidity (%)</label>
        <input
          id="humidityPercent"
          name="humidityPercent"
          type="number"
          step="0.1"
          min="0"
          max="100"
          className="w-28 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="coolstoreNotes" className="text-sm font-medium text-kf-charcoal">Notes</label>
        <input
          id="coolstoreNotes"
          name="notes"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Logging…" : "Log reading"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
