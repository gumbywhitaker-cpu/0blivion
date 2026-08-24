"use client";

import { useActionState } from "react";
import { resolveIssueAction, type ResolveFormState } from "./actions";

export function ResolveIssueForm({ issueId }: { issueId: string }) {
  const [state, action, pending] = useActionState<ResolveFormState, FormData>(resolveIssueAction, undefined);

  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="issueId" value={issueId} />
      <input
        type="text"
        name="note"
        placeholder="Resolution note (which value is correct, and why)"
        className="min-w-[220px] flex-1 rounded-md border border-kf-border bg-white px-2 py-1 text-xs"
      />
      <button type="submit" disabled={pending} className="btn rounded-md bg-kf-green-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-60">
        {pending ? "Saving…" : "Mark resolved"}
      </button>
      {state?.error ? <span className="text-xs text-kf-red">{state.error}</span> : null}
    </form>
  );
}
