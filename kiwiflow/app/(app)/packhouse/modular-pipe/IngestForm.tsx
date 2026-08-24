"use client";

import { useActionState } from "react";
import { ingestDocumentAction, type FormState } from "./actions";
import { ModularPipeStatusBadge, ModularPipeIssueSeverityBadge } from "@/lib/ui/badges";

export function IngestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(ingestDocumentAction, undefined);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4 rounded-lg border border-kf-border bg-kf-card p-4 text-sm">
        <div>
          <label className="text-xs font-semibold uppercase text-kf-muted">Document type hint (optional, not authoritative)</label>
          <select name="sourceTypeHint" defaultValue="" className="mt-1 w-full rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm">
            <option value="">Let the pipeline classify it</option>
            <option value="quality_log">Quality log</option>
            <option value="bin_origin">Bin origin record</option>
            <option value="rse_timesheet">RSE timesheet</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-kf-muted">Paste text (email body, CSV rows, typed notes)</label>
          <textarea
            name="text"
            rows={8}
            placeholder="Paste the document's text here…"
            className="mt-1 w-full rounded-md border border-kf-border bg-white px-2 py-1.5 font-mono text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-kf-muted">Or upload a photo/scan (image only)</label>
          <input type="file" name="file" accept="image/*" className="mt-1 w-full text-sm" />
          <p className="mt-1 text-xs text-kf-muted">
            PDFs/spreadsheets: paste their text content above instead — this build doesn&apos;t run a document
            converter, only image OCR via the classification model.
          </p>
        </div>

        {state?.error ? <p className="text-kf-red">{state.error}</p> : null}

        <button type="submit" disabled={pending} className="btn self-start rounded-md bg-kf-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Processing…" : "Ingest document"}
        </button>
      </form>

      {state?.result ? (
        <div className="rounded-lg border border-kf-border bg-kf-card p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <p className="font-semibold text-kf-charcoal">
              Classified as: {state.result.source_type}
            </p>
            <ModularPipeStatusBadge status={state.result.status} />
          </div>
          <p className="mb-3 text-xs text-kf-muted">
            {state.result.records.length} record{state.result.records.length === 1 ? "" : "s"} extracted ·{" "}
            {state.result.errors.length} issue{state.result.errors.length === 1 ? "" : "s"}
          </p>
          {state.result.errors.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {state.result.errors.map((e, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ModularPipeIssueSeverityBadge severity={e.severity} />
                  <span>{e.message}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
