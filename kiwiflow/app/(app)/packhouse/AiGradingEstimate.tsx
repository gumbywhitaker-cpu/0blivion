"use client";

import { useActionState } from "react";
import { estimateGradingFromPhotoAction, type AiEstimateFormState } from "./actions";

const QUALITY_LABEL: Record<string, string> = {
  LOOKS_CONSISTENT_WITH_CLASS_1: "Looks consistent with Class 1",
  VISIBLE_DEFECTS: "Visible defects",
  UNCLEAR: "Unclear from the photo",
};

export function AiGradingEstimate({ jobId }: { jobId: string }) {
  const [state, action, pending] = useActionState<AiEstimateFormState, FormData>(
    estimateGradingFromPhotoAction,
    undefined,
  );

  return (
    <details className="rounded-lg border border-dashed border-kf-border bg-white p-3 text-sm">
      <summary className="cursor-pointer font-medium text-kf-charcoal">
        Get an AI photo estimate (optional cross-check)
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        <p className="text-xs text-kf-muted">
          A quick visual impression from a photo — not a calibrated measurement, and it never fills in the
          form for you. The photo is sent for this one estimate and isn&apos;t stored anywhere in
          KiwiFlow.
        </p>
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="jobId" value={jobId} />
          <input
            type="file"
            name="photo"
            accept="image/*"
            required
            className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-kf-green-100 file:px-2 file:py-1.5 file:text-xs file:font-semibold file:text-kf-green-700"
          />
          <button
            type="submit"
            disabled={pending}
            className="btn rounded-md border border-kf-border px-3 py-1.5 text-xs font-semibold hover:bg-kf-green-100 disabled:opacity-60"
          >
            {pending ? "Analysing…" : "Get AI estimate"}
          </button>
        </form>
        {state?.error ? <p className="text-xs font-medium text-kf-red">{state.error}</p> : null}
        {state?.estimate ? (
          <div className="rounded-md border border-kf-gold bg-kf-gold/10 p-2 text-xs">
            <p>
              <span className="font-semibold">Size:</span> {state.estimate.sizeImpression} ·{" "}
              <span className="font-semibold">Quality:</span> {QUALITY_LABEL[state.estimate.qualityImpression]}
              {state.estimate.visibleDefectPercent != null ? (
                <>
                  {" "}
                  · <span className="font-semibold">Visible defects:</span> ~{state.estimate.visibleDefectPercent}%
                </>
              ) : null}
            </p>
            <p className="mt-1">{state.estimate.colorNote}</p>
            <p className="mt-1 italic text-kf-muted">
              {state.estimate.notes} (confidence: {state.estimate.confidence})
            </p>
          </div>
        ) : null}
      </div>
    </details>
  );
}
