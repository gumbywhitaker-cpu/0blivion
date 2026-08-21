"use client";

import { useActionState } from "react";
import { createOrchardAction, type FormState } from "../actions";

export default function NewOrchardPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(createOrchardAction, undefined);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-kf-charcoal">New orchard</h1>
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-kf-charcoal">
            Orchard name
          </label>
          <input
            id="name"
            name="name"
            required
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="region" className="text-sm font-medium text-kf-charcoal">
            Region
          </label>
          <input
            id="region"
            name="region"
            placeholder="e.g. Bay of Plenty"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium text-kf-charcoal">
            Address
          </label>
          <input
            id="address"
            name="address"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hectares" className="text-sm font-medium text-kf-charcoal">
            Hectares
          </label>
          <input
            id="hectares"
            name="hectares"
            type="number"
            step="0.01"
            min="0"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-kf-charcoal">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
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
          {pending ? "Saving…" : "Create orchard"}
        </button>
      </form>
    </div>
  );
}
