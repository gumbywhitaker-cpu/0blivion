"use client";

import { useActionState } from "react";
import { assignDriverToJobAction, updateEtaAction, type FormState } from "../actions";

type Option = { id: string; name: string };

function ErrorText({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <p className="mt-1 text-sm font-medium text-kf-red" role="alert">
      {state.error}
    </p>
  );
}

export function AssignDriverForm({ jobId, drivers }: { jobId: string; drivers: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(assignDriverToJobAction, undefined);
  if (drivers.length === 0) {
    return (
      <p className="text-sm text-kf-muted">
        No drivers on your team yet — add a user with the DRIVER role to assign this delivery.
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-4">
      <label htmlFor="driverId" className="text-sm font-medium text-kf-charcoal">
        Assign a driver
      </label>
      <input type="hidden" name="jobId" value={jobId} />
      <div className="flex flex-wrap gap-2">
        <select
          id="driverId"
          name="driverId"
          required
          defaultValue=""
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          <option value="" disabled>
            Choose a driver
          </option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        >
          {pending ? "Assigning…" : "Assign"}
        </button>
      </div>
      <ErrorText state={state} />
    </form>
  );
}

export function UpdateEtaForm({ jobId, currentEta }: { jobId: string; currentEta: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateEtaAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-4">
      <label htmlFor="etaAt" className="text-sm font-medium text-kf-charcoal">
        Update ETA
      </label>
      <input type="hidden" name="jobId" value={jobId} />
      <div className="flex flex-wrap gap-2">
        <input
          id="etaAt"
          name="etaAt"
          type="datetime-local"
          required
          defaultValue={currentEta ?? ""}
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        >
          {pending ? "Updating…" : "Update ETA"}
        </button>
      </div>
      <ErrorText state={state} />
    </form>
  );
}
