"use client";

import { useActionState } from "react";
import { logPieceRateAction, type FormState } from "../../../actions";

export function PieceRateForm({ crewMemberId }: { crewMemberId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(logPieceRateAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="crewMemberId" value={crewMemberId} />
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="recordDate" className="text-sm font-medium text-kf-charcoal">
            Date
          </label>
          <input
            id="recordDate"
            name="recordDate"
            type="date"
            required
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="unit" className="text-sm font-medium text-kf-charcoal">
            Unit
          </label>
          <input
            id="unit"
            name="unit"
            placeholder="bin"
            required
            className="w-24 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="quantity" className="text-sm font-medium text-kf-charcoal">
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-24 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ratePerUnit" className="text-sm font-medium text-kf-charcoal">
            Rate ($/unit)
          </label>
          <input
            id="ratePerUnit"
            name="ratePerUnit"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-24 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Log output"}
      </button>
      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
