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
      <div className="flex flex-col gap-1">
        <label htmlFor="employmentType" className="text-sm font-medium text-kf-charcoal">
          Pay type
        </label>
        <select
          id="employmentType"
          name="employmentType"
          defaultValue="HOURLY"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          <option value="HOURLY">Hourly</option>
          <option value="PIECE_RATE">Piece rate</option>
          <option value="SALARY">Salary</option>
          <option value="MIXED">Mixed</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="hourlyRate" className="text-sm font-medium text-kf-charcoal">
          Hourly rate ($)
        </label>
        <input
          id="hourlyRate"
          name="hourlyRate"
          type="number"
          step="0.01"
          min="0"
          className="w-28 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="minGuaranteedHoursPerWeek" className="text-sm font-medium text-kf-charcoal">
          Min guaranteed hrs/week
        </label>
        <input
          id="minGuaranteedHoursPerWeek"
          name="minGuaranteedHoursPerWeek"
          type="number"
          step="0.5"
          min="0"
          className="w-28 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="minimumWageType" className="text-sm font-medium text-kf-charcoal">
          Minimum wage rate
        </label>
        <select
          id="minimumWageType"
          name="minimumWageType"
          defaultValue="ADULT"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          <option value="ADULT">Adult</option>
          <option value="STARTING_OUT_TRAINING">Starting-out / training</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-kf-charcoal">
        <input id="isRse" name="isRse" type="checkbox" className="h-4 w-4" />
        RSE worker
      </label>
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
