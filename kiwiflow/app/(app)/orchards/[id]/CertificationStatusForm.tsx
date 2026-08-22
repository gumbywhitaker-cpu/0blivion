"use client";

import { useActionState } from "react";
import { updateCertificationStatusAction, type FormState } from "../../certifications/actions";

export function CertificationStatusForm({ certificationId }: { certificationId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateCertificationStatusAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="certificationId" value={certificationId} />
      <select name="status" defaultValue="IN_PROGRESS" className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-xs">
        <option value="NOT_STARTED">Not started</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="CERTIFIED">Certified</option>
        <option value="EXPIRED">Expired</option>
        <option value="SUSPENDED">Suspended</option>
      </select>
      <input name="expiryDate" type="date" className="rounded-md border border-kf-border bg-white px-2 py-1.5 text-xs" placeholder="New expiry" />
      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md border border-kf-border px-2 py-1.5 text-xs font-semibold hover:bg-kf-green-100 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update"}
      </button>
      {state?.error ? <p className="w-full text-xs font-medium text-kf-red">{state.error}</p> : null}
    </form>
  );
}
