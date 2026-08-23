"use client";

import { useActionState } from "react";
import { logTimeEntryAction, type FormState } from "../../../actions";

export function TimeEntryForm({ crewMemberId }: { crewMemberId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(logTimeEntryAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="crewMemberId" value={crewMemberId} />
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="clockIn" className="text-sm font-medium text-kf-charcoal">
            Clock in
          </label>
          <input
            id="clockIn"
            name="clockIn"
            type="datetime-local"
            required
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="clockOut" className="text-sm font-medium text-kf-charcoal">
            Clock out
          </label>
          <input
            id="clockOut"
            name="clockOut"
            type="datetime-local"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="breakMinutes" className="text-sm font-medium text-kf-charcoal">
            Break (mins)
          </label>
          <input
            id="breakMinutes"
            name="breakMinutes"
            type="number"
            min="0"
            defaultValue="0"
            className="w-24 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Log time"}
      </button>
      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
