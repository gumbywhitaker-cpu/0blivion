"use client";

import { useActionState } from "react";
import { recordGradingResultAction, type FormState } from "./actions";

export function GradingForm({
  jobId,
  existing,
}: {
  jobId: string;
  existing?: {
    gradingDate: string;
    totalTrayEquivalents: number;
    class1Percent: number | null;
    class2Percent: number | null;
    rejectPercent: number | null;
    averageBrix: number | null;
    notes: string | null;
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordGradingResultAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-3 text-sm">
      <input type="hidden" name="jobId" value={jobId} />
      <p className="text-xs font-semibold uppercase text-kf-muted">
        {existing ? "Update grading result (manual entry)" : "Record grading result (manual entry)"}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-kf-muted">Grading date</label>
          <input
            name="gradingDate"
            type="date"
            required
            defaultValue={existing?.gradingDate}
            className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-kf-muted">Total tray equiv.</label>
          <input
            name="totalTrayEquivalents"
            type="number"
            step="0.1"
            min="0"
            required
            defaultValue={existing?.totalTrayEquivalents}
            className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-kf-muted">Class 1 %</label>
          <input
            name="class1Percent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={existing?.class1Percent ?? undefined}
            className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-kf-muted">Class 2 %</label>
          <input
            name="class2Percent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={existing?.class2Percent ?? undefined}
            className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-kf-muted">Reject %</label>
          <input
            name="rejectPercent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            defaultValue={existing?.rejectPercent ?? undefined}
            className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-kf-muted">Avg Brix</label>
          <input
            name="averageBrix"
            type="number"
            step="0.1"
            min="0"
            defaultValue={existing?.averageBrix ?? undefined}
            className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <input
        name="notes"
        placeholder="Notes"
        defaultValue={existing?.notes ?? undefined}
        className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm"
      />
      {state?.error ? <p className="text-sm font-medium text-kf-red" role="alert">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : existing ? "Update result" : "Save result"}
      </button>
    </form>
  );
}
