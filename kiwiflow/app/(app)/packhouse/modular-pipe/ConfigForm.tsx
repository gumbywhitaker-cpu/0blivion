"use client";

import { useActionState } from "react";
import { updateModularPipeConfigAction, type ConfigFormState } from "./actions";
import { ACTIVE_PACKS } from "@/lib/modularPipe/types";
import type { ModularPipeConfigValues } from "@/lib/modularPipe/config";

export function ConfigForm({ config, canManage }: { config: ModularPipeConfigValues; canManage: boolean }) {
  const [state, action, pending] = useActionState<ConfigFormState, FormData>(updateModularPipeConfigAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-lg border border-kf-border bg-kf-card p-4 text-sm">
      <div>
        <label className="text-xs font-semibold uppercase text-kf-muted">Active pack</label>
        <select
          name="activePack"
          defaultValue={config.activePack}
          disabled={!canManage}
          className="mt-1 w-full rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
        >
          {ACTIVE_PACKS.map((pack) => (
            <option key={pack} value={pack}>
              {pack === "packing_house" ? "Packing House Pack (v1.0.0)" : pack}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-kf-muted">
          Only the Packing House Pack is implemented today — this is a placeholder for future cartridges
          (trucking, port logistics), not a live switch to a second pack.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-kf-muted">Enabled document types</p>
        <div className="mt-1 flex flex-wrap gap-4">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="enabledQualityLog" defaultChecked={config.enabledDocTypes.includes("quality_log")} disabled={!canManage} />
            Quality logs
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="enabledBinOrigin" defaultChecked={config.enabledDocTypes.includes("bin_origin")} disabled={!canManage} />
            Bin origins
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="enabledRseTimesheet" defaultChecked={config.enabledDocTypes.includes("rse_timesheet")} disabled={!canManage} />
            RSE timesheets
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase text-kf-muted">Max shift length (hours)</label>
          <input
            type="range"
            name="maxShiftHours"
            min={1}
            max={24}
            step={0.5}
            defaultValue={config.maxShiftHours}
            disabled={!canManage}
            className="mt-1 w-full"
            onChange={(e) => {
              const out = e.currentTarget.nextElementSibling;
              if (out) out.textContent = `${e.currentTarget.value}h`;
            }}
          />
          <output className="text-xs text-kf-muted">{config.maxShiftHours}h</output>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-kf-muted">OCR confidence threshold</label>
          <input
            type="range"
            name="ocrConfidenceThreshold"
            min={0}
            max={1}
            step={0.05}
            defaultValue={config.ocrConfidenceThreshold}
            disabled={!canManage}
            className="mt-1 w-full"
            onChange={(e) => {
              const out = e.currentTarget.nextElementSibling;
              if (out) out.textContent = e.currentTarget.value;
            }}
          />
          <output className="text-xs text-kf-muted">{config.ocrConfidenceThreshold}</output>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-kf-muted">Hours rounding tolerance (minutes)</label>
          <input
            type="number"
            name="hoursRoundingToleranceMinutes"
            min={0}
            max={120}
            defaultValue={config.hoursRoundingToleranceMinutes}
            disabled={!canManage}
            className="mt-1 w-full rounded-md border border-kf-border bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          />
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="strictCrossDocChecks" defaultChecked={config.strictCrossDocChecks} disabled={!canManage} />
            Strict cross-document checks (missing bin origin / conflicts are errors, not warnings)
          </label>
        </div>
      </div>

      {state?.error ? <p className="text-kf-red">{state.error}</p> : null}
      {state?.success ? <p className="text-kf-green-700">Settings saved.</p> : null}

      {canManage ? (
        <button type="submit" disabled={pending} className="btn self-start rounded-md bg-kf-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Saving…" : "Save settings"}
        </button>
      ) : (
        <p className="text-xs text-kf-muted">Only an OWNER or MANAGER can change these settings.</p>
      )}
    </form>
  );
}
