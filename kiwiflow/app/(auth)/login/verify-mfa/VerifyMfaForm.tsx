"use client";

import { useActionState } from "react";
import { verifyMfaAction, type FormState } from "../../actions";

export function VerifyMfaForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyMfaAction, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="code" className="text-sm font-medium text-kf-charcoal">
          Code
        </label>
        <input
          id="code"
          name="code"
          required
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
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
        className="btn rounded-md bg-kf-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}
