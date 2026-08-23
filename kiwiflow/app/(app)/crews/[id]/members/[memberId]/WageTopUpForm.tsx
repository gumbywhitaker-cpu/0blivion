"use client";

import { useActionState } from "react";
import { recordWageTopUpAction, type FormState } from "../../../actions";

export function WageTopUpForm({ crewMemberId, weekStart }: { crewMemberId: string; weekStart: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordWageTopUpAction, undefined);

  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="crewMemberId" value={crewMemberId} />
      <input type="hidden" name="weekStart" value={weekStart} />
      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md bg-kf-red px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Recording…" : "Record top-up payment"}
      </button>
      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
