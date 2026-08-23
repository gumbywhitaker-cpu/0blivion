"use client";

import { useActionState } from "react";
import { recordBiosecurityInspectionAction, type FormState } from "./complianceActions";

export function BiosecurityInspectionForm({ jobId, orchardId }: { jobId: string; orchardId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordBiosecurityInspectionAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-kf-border bg-kf-card p-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="orchardId" value={orchardId} />
      <h3 className="font-semibold text-kf-charcoal">Record a biosecurity finding</h3>
      <p className="text-xs text-kf-muted">
        KiwiFlow&apos;s own orchard-risk log — not a submission to KVH or any biosecurity authority.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="inspectionDate" className="text-xs font-medium text-kf-charcoal">Date</label>
          <input id="inspectionDate" name="inspectionDate" type="date" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-xs font-medium text-kf-charcoal">Category</label>
          <select id="category" name="category" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm">
            <option value="PSA">Psa</option>
            <option value="BMSB">BMSB (stink bug)</option>
            <option value="OTHER_PEST">Other pest</option>
            <option value="OTHER_DISEASE">Other disease</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="riskLevel" className="text-xs font-medium text-kf-charcoal">Risk level</label>
          <select id="riskLevel" name="riskLevel" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="findings" className="text-xs font-medium text-kf-charcoal">Findings</label>
        <textarea id="findings" name="findings" required rows={2} className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="actionTaken" className="text-xs font-medium text-kf-charcoal">Action taken</label>
        <input id="actionTaken" name="actionTaken" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-kf-charcoal">
          <input id="followUpRequired" name="followUpRequired" type="checkbox" className="h-4 w-4" />
          Follow-up required
        </label>
        <div className="flex flex-col gap-1">
          <label htmlFor="followUpDate" className="text-xs font-medium text-kf-charcoal">Follow-up date</label>
          <input id="followUpDate" name="followUpDate" type="date" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
      </div>
      {state?.error ? <p className="text-sm font-medium text-kf-red" role="alert">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save finding"}
      </button>
    </form>
  );
}
