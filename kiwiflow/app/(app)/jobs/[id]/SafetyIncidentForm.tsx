"use client";

import { useActionState } from "react";
import { recordSafetyIncidentAction, type FormState } from "./complianceActions";

export function SafetyIncidentForm({ jobId, orchardId }: { jobId: string; orchardId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordSafetyIncidentAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-kf-border bg-kf-card p-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="orchardId" value={orchardId} />
      <h3 className="font-semibold text-kf-charcoal">Report a health & safety hazard, near miss, or incident</h3>
      <p className="text-xs text-kf-muted">
        KiwiFlow&apos;s own H&amp;S log — not a submission to WorkSafe. A CRITICAL severity is a heads-up
        that this may meet the Health and Safety at Work Act&apos;s definition of a notifiable event; you
        still need to notify WorkSafe yourself if it applies.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="incidentDate" className="text-xs font-medium text-kf-charcoal">Date</label>
          <input id="incidentDate" name="incidentDate" type="date" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-xs font-medium text-kf-charcoal">Type</label>
          <select id="type" name="type" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm">
            <option value="HAZARD">Hazard</option>
            <option value="NEAR_MISS">Near miss</option>
            <option value="INCIDENT">Incident</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="severity" className="text-xs font-medium text-kf-charcoal">Severity</label>
          <select id="severity" name="severity" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-xs font-medium text-kf-charcoal">What happened</label>
        <textarea id="description" name="description" required rows={2} className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="safetyActionTaken" className="text-xs font-medium text-kf-charcoal">Action taken</label>
        <input id="safetyActionTaken" name="actionTaken" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-kf-charcoal">
          <input id="injuryInvolved" name="injuryInvolved" type="checkbox" className="h-4 w-4" />
          Injury involved
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-kf-charcoal">
          <input id="safetyFollowUpRequired" name="followUpRequired" type="checkbox" className="h-4 w-4" />
          Follow-up required
        </label>
        <div className="flex flex-col gap-1">
          <label htmlFor="safetyFollowUpDate" className="text-xs font-medium text-kf-charcoal">Follow-up date</label>
          <input id="safetyFollowUpDate" name="followUpDate" type="date" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
      </div>
      {state?.error ? <p className="text-sm font-medium text-kf-red" role="alert">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save report"}
      </button>
    </form>
  );
}
