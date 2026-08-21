"use client";

import { useActionState } from "react";
import { createInviteAction, type FormState } from "./actions";

export function InviteForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createInviteAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="contractorName" className="text-sm font-medium text-kf-charcoal">
          Contractor name (optional)
        </label>
        <input
          id="contractorName"
          name="contractorName"
          placeholder="e.g. Southern Harvest Crews"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Generating…" : "Generate OneTap QR"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
