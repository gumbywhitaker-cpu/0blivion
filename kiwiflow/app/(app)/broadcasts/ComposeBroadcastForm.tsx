"use client";

import { useActionState, useState } from "react";
import { sendBroadcastAction, type FormState } from "./actions";
import { NOTIFICATION_URGENCIES } from "@/lib/types";

type Option = { id: string; name: string };

export function ComposeBroadcastForm({ contractors }: { contractors: Option[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendBroadcastAction, undefined);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-kf-charcoal">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Spray window closing early today"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-sm font-medium text-kf-charcoal">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="urgency" className="text-sm font-medium text-kf-charcoal">
          Urgency
        </label>
        <select
          id="urgency"
          name="urgency"
          defaultValue="NORMAL"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          {NOTIFICATION_URGENCIES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <p className="text-xs text-kf-muted">
          NORMAL is in-app only. URGENT and CRITICAL also try email/SMS where a provider is configured.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-4">
        <legend className="px-1 text-sm font-medium text-kf-charcoal">Send to</legend>
        {contractors.length === 0 ? (
          <p className="text-sm text-kf-muted">No linked contractors yet.</p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm text-kf-charcoal">
              <input
                type="checkbox"
                checked={selected.length === contractors.length}
                onChange={(e) => setSelected(e.target.checked ? contractors.map((c) => c.id) : [])}
              />
              All contractors
            </label>
            <div className="flex flex-col gap-1 border-t border-kf-border pt-2">
              {contractors.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-kf-charcoal">
                  <input
                    type="checkbox"
                    name="recipientOrgIds"
                    value={c.id}
                    checked={selected.includes(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </>
        )}
      </fieldset>

      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || contractors.length === 0}
        className="btn self-start rounded-md bg-kf-green-600 px-6 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send broadcast"}
      </button>
    </form>
  );
}
