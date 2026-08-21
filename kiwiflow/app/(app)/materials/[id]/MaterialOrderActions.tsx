"use client";

import { useActionState, type ReactNode } from "react";
import { transitionMaterialOrderAction, type FormState } from "../actions";
import type { MaterialOrderStatus } from "@/lib/types";

function ErrorText({ state }: { state: FormState }) {
  if (!state?.error) return null;
  return (
    <p className="mt-1 text-sm font-medium text-kf-red" role="alert">
      {state.error}
    </p>
  );
}

function TransitionButton({
  orderId,
  toStatus,
  label,
  variant = "primary",
}: {
  orderId: string;
  toStatus: MaterialOrderStatus;
  label: string;
  variant?: "primary" | "danger";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(transitionMaterialOrderAction, undefined);
  const className =
    variant === "danger"
      ? "btn rounded-md border border-kf-red px-4 py-2 text-sm font-medium text-kf-red hover:bg-kf-red/5 disabled:opacity-60"
      : "btn rounded-md bg-kf-green-600 px-5 py-3 text-base font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60";
  return (
    <form action={action} className="inline-block">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="toStatus" value={toStatus} />
      <button type="submit" disabled={pending} className={className}>
        {pending ? "Working…" : label}
      </button>
      <ErrorText state={state} />
    </form>
  );
}

export function MaterialOrderActions({ orderId, status }: { orderId: string; status: MaterialOrderStatus }) {
  const buttons: ReactNode[] = [];

  if (status === "DRAFT") {
    buttons.push(<TransitionButton key="submit" orderId={orderId} toStatus="SUBMITTED" label="Submit to supplier" />);
  }
  if (status === "SUBMITTED") {
    buttons.push(<TransitionButton key="confirm" orderId={orderId} toStatus="CONFIRMED" label="Mark confirmed" />);
  }
  if (status === "CONFIRMED") {
    buttons.push(<TransitionButton key="deliver" orderId={orderId} toStatus="DELIVERED" label="Mark delivered" />);
  }
  if (status === "DRAFT" || status === "SUBMITTED" || status === "CONFIRMED") {
    buttons.push(
      <TransitionButton key="cancel" orderId={orderId} toStatus="CANCELLED" label="Cancel order" variant="danger" />,
    );
  }

  if (buttons.length === 0) return null;

  return <div className="flex flex-wrap items-start gap-3">{buttons}</div>;
}
