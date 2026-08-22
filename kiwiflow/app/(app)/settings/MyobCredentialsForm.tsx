"use client";

import { useActionState } from "react";
import { setMyobCredentialsAction, type FormState } from "./myobActions";

export function MyobCredentialsForm({ hasCredentials }: { hasCredentials: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setMyobCredentialsAction, undefined);

  return (
    <form action={action} className="flex max-w-sm flex-col gap-3">
      <p className="text-xs text-kf-muted">
        {hasCredentials
          ? "Company file sign-in is set. Update it below if it changes."
          : "MYOB company files need their own sign-in, separate from the OAuth connection above."}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor="myobCfUsername" className="text-sm font-medium text-kf-charcoal">
          Company file username
        </label>
        <input
          id="myobCfUsername"
          name="myobCfUsername"
          required
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="myobCfPassword" className="text-sm font-medium text-kf-charcoal">
          Company file password
        </label>
        <input
          id="myobCfPassword"
          name="myobCfPassword"
          type="password"
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
        className="btn self-start rounded-md border border-kf-border px-4 py-2 text-sm font-semibold hover:bg-kf-green-100"
      >
        {pending ? "Saving…" : "Save company file sign-in"}
      </button>
    </form>
  );
}
