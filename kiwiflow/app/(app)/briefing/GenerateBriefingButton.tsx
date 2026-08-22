"use client";

import { useActionState } from "react";
import { generateBriefingAction, type FormState } from "./actions";

export function GenerateBriefingButton() {
  const [state, action, pending] = useActionState<FormState, FormData>(generateBriefingAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Regenerating…" : "Regenerate briefing"}
      </button>
      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
