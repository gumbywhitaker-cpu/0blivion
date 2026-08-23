"use client";

import { useActionState } from "react";
import { onboardAction, type FormState } from "./actions";

export function OnboardForm({ token, defaultOrgName }: { token: string; defaultOrgName?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(onboardAction, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1">
        <label htmlFor="orgName" className="text-sm font-medium text-kf-charcoal">
          Your business name
        </label>
        <input
          id="orgName"
          name="orgName"
          required
          defaultValue={defaultOrgName}
          className="rounded-md border border-kf-border bg-white px-3 py-3 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-kf-charcoal">
          Your name
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="rounded-md border border-kf-border bg-white px-3 py-3 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-kf-charcoal">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-kf-border bg-white px-3 py-3 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-kf-charcoal">
          Mobile (optional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="rounded-md border border-kf-border bg-white px-3 py-3 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-kf-charcoal">
          Set a password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-kf-border bg-white px-3 py-3 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="crewMembers" className="text-sm font-medium text-kf-charcoal">
          Crew members (optional)
        </label>
        <textarea
          id="crewMembers"
          name="crewMembers"
          rows={3}
          placeholder={"One per line: Name, phone\ne.g. Tama Rangi, 021 555 0101"}
          className="rounded-md border border-kf-border bg-white px-3 py-3 text-base outline-none focus:border-kf-green-600"
        />
        <span className="text-xs text-kf-muted">You can add more later — this just gets you started.</span>
      </div>

      {state?.error ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn rounded-md bg-kf-green-600 px-4 py-4 text-lg font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {pending ? "Setting you up…" : "Get started"}
      </button>
    </form>
  );
}
