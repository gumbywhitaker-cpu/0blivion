"use client";

import { useActionState } from "react";
import { createCertificationAction, type FormState } from "./actions";

export function CertificationForm({ orchards }: { orchards: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createCertificationAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-kf-border bg-kf-card p-4">
      <h3 className="font-semibold text-kf-charcoal">Record a certification</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="orchardId" className="text-xs font-medium text-kf-charcoal">Orchard</label>
          <select id="orchardId" name="orchardId" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm">
            {orchards.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="scheme" className="text-xs font-medium text-kf-charcoal">Scheme</label>
          <select id="scheme" name="scheme" required className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm">
            <option value="NZGAP">NZGAP</option>
            <option value="GLOBALGAP">GLOBALG.A.P.</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-kf-charcoal">Status</label>
          <select id="status" name="status" required defaultValue="IN_PROGRESS" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm">
            <option value="NOT_STARTED">Not started</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="CERTIFIED">Certified</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="certificateNumber" className="text-xs font-medium text-kf-charcoal">Certificate number</label>
          <input id="certificateNumber" name="certificateNumber" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ggn" className="text-xs font-medium text-kf-charcoal">GGN</label>
          <input id="ggn" name="ggn" placeholder="GLOBALG.A.P. Number" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="issuedDate" className="text-xs font-medium text-kf-charcoal">Issued</label>
          <input id="issuedDate" name="issuedDate" type="date" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="expiryDate" className="text-xs font-medium text-kf-charcoal">Expires</label>
          <input id="expiryDate" name="expiryDate" type="date" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="certNotes" className="text-xs font-medium text-kf-charcoal">Notes</label>
        <input id="certNotes" name="notes" className="rounded-md border border-kf-border bg-white px-2 py-2 text-sm" />
      </div>
      {state?.error ? <p className="text-sm font-medium text-kf-red" role="alert">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save certification"}
      </button>
    </form>
  );
}
