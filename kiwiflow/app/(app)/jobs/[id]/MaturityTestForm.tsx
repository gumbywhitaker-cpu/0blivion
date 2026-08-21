"use client";

import { useActionState } from "react";
import { recordMaturityTestAction, type FormState } from "./complianceActions";
import { KIWIFRUIT_VARIETIES } from "@/lib/types";

export function MaturityTestForm({ jobId, orchardId }: { jobId: string; orchardId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordMaturityTestAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-kf-border bg-kf-card p-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="orchardId" value={orchardId} />
      <h3 className="font-semibold text-kf-charcoal">Record a maturity test</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="variety" className="text-xs font-medium text-kf-charcoal">Variety</label>
          <select id="variety" name="variety" defaultValue="HAYWARD" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm">
            {KIWIFRUIT_VARIETIES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="testDate" className="text-xs font-medium text-kf-charcoal">Test date</label>
          <input id="testDate" name="testDate" type="date" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="brix" className="text-xs font-medium text-kf-charcoal">Brix (°Bx)</label>
          <input id="brix" name="brix" type="number" step="0.1" min="0" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dryMatterPercent" className="text-xs font-medium text-kf-charcoal">Dry matter %</label>
          <input id="dryMatterPercent" name="dryMatterPercent" type="number" step="0.1" min="0" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sampleSize" className="text-xs font-medium text-kf-charcoal">Sample size</label>
          <input id="sampleSize" name="sampleSize" type="number" min="0" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="labOrTester" className="text-xs font-medium text-kf-charcoal">Lab / tester</label>
          <input id="labOrTester" name="labOrTester" placeholder="e.g. independent lab name, or in-house" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="maturityNotes" className="text-xs font-medium text-kf-charcoal">Notes</label>
        <input id="maturityNotes" name="notes" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
      </div>
      {state?.error ? <p className="text-sm font-medium text-kf-red" role="alert">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save test"}
      </button>
    </form>
  );
}
