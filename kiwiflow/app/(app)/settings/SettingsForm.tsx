"use client";

import { useActionState } from "react";
import { updateOrgSettingsAction, type FormState } from "./actions";

export function SettingsForm({
  defaults,
}: {
  defaults: { name: string; gstNumber: string; address: string; phone: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrgSettingsAction, undefined);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-kf-charcoal">
          Organisation name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaults.name}
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="gstNumber" className="text-sm font-medium text-kf-charcoal">
          GST number
        </label>
        <input
          id="gstNumber"
          name="gstNumber"
          defaultValue={defaults.gstNumber}
          placeholder="e.g. 123-456-789"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
        <span className="text-xs text-kf-muted">
          Required on invoices over $200 under IRD&apos;s taxable supply information rules.
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-kf-charcoal">
          Business address
        </label>
        <input
          id="address"
          name="address"
          defaultValue={defaults.address}
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
          defaultValue={defaults.phone}
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>

      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm font-medium text-kf-green-600">Saved.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-6 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
