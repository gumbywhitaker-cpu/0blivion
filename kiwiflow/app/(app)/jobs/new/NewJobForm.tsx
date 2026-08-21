"use client";

import { useActionState } from "react";
import { createJobAction, type FormState } from "../actions";
import { JOB_TYPES, JOB_PRIORITIES } from "@/lib/types";

type Option = { id: string; name: string };

export function NewJobForm({
  orchards,
  contractors,
  defaultOrchardId,
}: {
  orchards: Option[];
  contractors: Option[];
  defaultOrchardId?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createJobAction, undefined);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="orchardId" className="text-sm font-medium text-kf-charcoal">
          Orchard
        </label>
        <select
          id="orchardId"
          name="orchardId"
          required
          defaultValue={defaultOrchardId ?? ""}
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          <option value="" disabled>
            Choose an orchard
          </option>
          {orchards.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="jobType" className="text-sm font-medium text-kf-charcoal">
          Job type
        </label>
        <select
          id="jobType"
          name="jobType"
          required
          defaultValue="HARVEST"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contractorOrgId" className="text-sm font-medium text-kf-charcoal">
          Contractor (optional)
        </label>
        <select
          id="contractorOrgId"
          name="contractorOrgId"
          defaultValue=""
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          <option value="">Unassigned for now</option>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="scheduledDate" className="text-sm font-medium text-kf-charcoal">
            Date
          </label>
          <input
            id="scheduledDate"
            name="scheduledDate"
            type="date"
            required
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="startTime" className="text-sm font-medium text-kf-charcoal">
            Start time
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="priority" className="text-sm font-medium text-kf-charcoal">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue="NORMAL"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          {JOB_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="rate" className="text-sm font-medium text-kf-charcoal">
            Rate ($)
          </label>
          <input
            id="rate"
            name="rate"
            type="number"
            step="0.01"
            min="0"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="unit" className="text-sm font-medium text-kf-charcoal">
            Per
          </label>
          <input
            id="unit"
            name="unit"
            placeholder="e.g. bin, hour, hectare"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="estimatedDurationMins" className="text-sm font-medium text-kf-charcoal">
          Estimated duration (minutes)
        </label>
        <input
          id="estimatedDurationMins"
          name="estimatedDurationMins"
          type="number"
          min="0"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="instructions" className="text-sm font-medium text-kf-charcoal">
          Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
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
        {pending ? "Scheduling…" : "Schedule job"}
      </button>
    </form>
  );
}
