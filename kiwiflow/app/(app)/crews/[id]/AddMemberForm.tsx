"use client";

import { useActionState } from "react";
import { addCrewMemberAction, type FormState } from "../actions";

export function AddMemberForm({ crewId }: { crewId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addCrewMemberAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="crewId" value={crewId} />
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-kf-charcoal">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-kf-charcoal">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add member"}
      </button>
      {state?.error ? (
        <p className="w-full text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
