"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enqueueTransition } from "@/lib/offline/queue";

/**
 * Offline-capable twins of TransitionButton/CompleteJobForm in JobActions.tsx,
 * used only for the contractor-side IN_PROGRESS/COMPLETE actions — the
 * actual field-offline scenario. Everything else (assign, confirm, cancel)
 * stays on the plain Server Action, since those happen at a desk with a
 * connection. Posts to /api/v1/jobs/transition (see lib/jobTransition.ts for
 * why that's a stable route rather than a Server Action).
 */

async function submitTransition(params: {
  jobId: string;
  toStatus: string;
  quantity?: number;
  jobLabel: string;
}): Promise<{ queued: boolean; error?: string }> {
  try {
    const res = await fetch("/api/v1/jobs/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: params.jobId, toStatus: params.toStatus, quantity: params.quantity }),
    });
    const json = await res.json();
    if (json.ok) return { queued: false };
    return { queued: false, error: json.error ?? "That didn't work" };
  } catch {
    // fetch() threw — no network. Queue it rather than showing an error.
    await enqueueTransition({
      jobId: params.jobId,
      toStatus: params.toStatus,
      quantity: params.quantity,
      jobLabel: params.jobLabel,
    });
    return { queued: true };
  }
}

export function OfflineStartButton({ jobId, jobLabel }: { jobId: string; jobLabel: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "working" | "queued" | { error: string }>("idle");

  return (
    <div className="inline-block">
      <button
        type="button"
        disabled={state === "working"}
        className="btn rounded-md bg-kf-green-600 px-5 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        onClick={async () => {
          setState("working");
          const result = await submitTransition({ jobId, toStatus: "IN_PROGRESS", jobLabel });
          if (result.queued) {
            setState("queued");
          } else if (result.error) {
            setState({ error: result.error });
          } else {
            router.refresh();
          }
        }}
      >
        {state === "working" ? "Working…" : "Start job"}
      </button>
      {state === "queued" ? (
        <p className="mt-1 text-sm font-medium text-kf-gold">No connection — queued, will sync automatically.</p>
      ) : null}
      {typeof state === "object" ? (
        <p className="mt-1 text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

export function OfflineCompleteForm({ jobId, jobLabel, unit }: { jobId: string; jobLabel: string; unit: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "working" | "queued" | { error: string }>("idle");
  const [quantity, setQuantity] = useState("");

  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-kf-border bg-kf-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const qty = Number.parseFloat(quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
          setState({ error: "Enter the completed quantity to mark this job done" });
          return;
        }
        setState("working");
        // Queued while offline, this is genuinely provisional — the driver's
        // own entered figure, not yet confirmed against the server's status
        // machine. It's applied for real only once the queue flushes.
        const result = await submitTransition({ jobId, toStatus: "COMPLETE", quantity: qty, jobLabel });
        if (result.queued) {
          setState("queued");
        } else if (result.error) {
          setState({ error: result.error });
        } else {
          router.refresh();
        }
      }}
    >
      <label htmlFor="offline-quantity" className="text-sm font-medium text-kf-charcoal">
        Quantity completed{unit ? ` (${unit})` : ""}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="offline-quantity"
          type="number"
          step="0.01"
          min="0"
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-32 rounded-md border border-kf-border bg-white px-3 py-3 text-lg outline-none focus:border-kf-green-600"
        />
        <button
          type="submit"
          disabled={state === "working"}
          className="btn rounded-md bg-kf-green-600 px-6 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        >
          {state === "working" ? "Finishing…" : "Mark complete"}
        </button>
      </div>
      {state === "queued" ? (
        <p className="text-sm font-medium text-kf-gold">No connection — queued, will sync automatically.</p>
      ) : null}
      {typeof state === "object" ? (
        <p className="text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
