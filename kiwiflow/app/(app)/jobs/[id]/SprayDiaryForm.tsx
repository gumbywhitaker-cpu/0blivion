"use client";

import { useActionState } from "react";
import { recordSprayEntryAction, type FormState } from "./complianceActions";

export function SprayDiaryForm({ jobId, orchardId }: { jobId: string; orchardId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordSprayEntryAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-kf-border bg-kf-card p-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="orchardId" value={orchardId} />
      <h3 className="font-semibold text-kf-charcoal">Record a spray diary entry</h3>
      <p className="text-xs text-kf-muted">
        Matches the fields Zespri&apos;s Spray Diary and NZS 8409:2021 expect — product, rate,
        area, applicator, date and withholding period.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="productName" className="text-xs font-medium text-kf-charcoal">Product name</label>
          <input id="productName" name="productName" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hsrNumber" className="text-xs font-medium text-kf-charcoal">HSR number</label>
          <input id="hsrNumber" name="hsrNumber" placeholder="if highly ecotoxic" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="activeIngredient" className="text-xs font-medium text-kf-charcoal">Active ingredient</label>
          <input id="activeIngredient" name="activeIngredient" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="rateApplied" className="text-xs font-medium text-kf-charcoal">Rate</label>
          <input id="rateApplied" name="rateApplied" type="number" step="0.01" min="0" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="rateUnit" className="text-xs font-medium text-kf-charcoal">Unit</label>
          <input id="rateUnit" name="rateUnit" placeholder="e.g. L/ha" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="areaTreatedHa" className="text-xs font-medium text-kf-charcoal">Area treated (ha)</label>
          <input id="areaTreatedHa" name="areaTreatedHa" type="number" step="0.01" min="0" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="applicationDate" className="text-xs font-medium text-kf-charcoal">Application date</label>
          <input id="applicationDate" name="applicationDate" type="date" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="withholdingPeriodDays" className="text-xs font-medium text-kf-charcoal">Withholding period (days)</label>
          <input id="withholdingPeriodDays" name="withholdingPeriodDays" type="number" min="0" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="targetPestOrDisease" className="text-xs font-medium text-kf-charcoal">Target</label>
          <input id="targetPestOrDisease" name="targetPestOrDisease" placeholder="pest / disease" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="weatherConditions" className="text-xs font-medium text-kf-charcoal">Weather</label>
          <input id="weatherConditions" name="weatherConditions" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="sprayNotes" className="text-xs font-medium text-kf-charcoal">Notes</label>
        <input id="sprayNotes" name="notes" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
      </div>
      {state?.error ? <p className="text-sm font-medium text-kf-red" role="alert">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}
