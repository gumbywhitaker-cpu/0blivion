"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type FormState } from "../actions";
import { SELF_SERVE_ORG_TYPES } from "@/lib/types";

// Labels for the shared SELF_SERVE_ORG_TYPES list (lib/types.ts) — that list is
// also what the server action validates against, so the two can't drift apart.
const ORG_TYPE_LABELS: Record<(typeof SELF_SERVE_ORG_TYPES)[number], string> = {
  GROWER: "Grower",
  CONTRACTOR: "Contractor",
  TRANSPORT: "Transport operator",
  PACKHOUSE: "Pack house",
  ACCOUNTANT: "Accountant",
};

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signupAction, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="orgType" className="text-sm font-medium text-kf-charcoal">
          I am a…
        </label>
        <select
          id="orgType"
          name="orgType"
          required
          defaultValue="GROWER"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        >
          {SELF_SERVE_ORG_TYPES.map((t) => (
            <option key={t} value={t}>
              {ORG_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="orgName" className="text-sm font-medium text-kf-charcoal">
          Organisation name
        </label>
        <input
          id="orgName"
          name="orgName"
          required
          placeholder="e.g. Whakatāne Orchards Ltd"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
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
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
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
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-kf-charcoal">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
        />
        <span className="text-xs text-kf-muted">At least 8 characters.</span>
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
        {pending ? "Creating…" : "Create organisation"}
      </button>

      <p className="text-sm text-kf-muted">
        Already on KiwiFlow?{" "}
        <Link href="/login" className="font-medium text-kf-green-600 underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
