"use client";

import { useActionState } from "react";
import { createCrewAction, type FormState } from "../actions";

export default function NewCrewPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(createCrewAction, undefined);

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-kf-charcoal">New crew</h1>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-kf-charcoal">
            Crew name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Team North"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
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
          className="btn self-start rounded-md bg-kf-green-600 px-6 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create crew"}
        </button>
      </form>
    </div>
  );
}
