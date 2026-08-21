"use client";

import { useActionState } from "react";
import { createSupplierAction, type FormState } from "../actions";
import { SUPPLIER_CATEGORIES } from "@/lib/types";

export function NewSupplierForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createSupplierAction, undefined);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4 rounded-lg border border-kf-border bg-kf-card p-4">
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
        <label htmlFor="category" className="text-sm font-medium text-kf-charcoal">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue="FERTILISER"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          {SUPPLIER_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contactName" className="text-sm font-medium text-kf-charcoal">
          Contact name
        </label>
        <input
          id="contactName"
          name="contactName"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-kf-charcoal">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-kf-charcoal">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
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
        {pending ? "Adding…" : "Add supplier"}
      </button>
    </form>
  );
}
