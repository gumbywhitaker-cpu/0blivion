"use client";

import { useActionState } from "react";
import { transitionExportShipmentAction, type FormState } from "../actions";
import type { ExportShipmentStatus } from "@/lib/types";

const LABELS: Record<ExportShipmentStatus, string> = {
  PREPARING: "Preparing",
  IN_TRANSIT_TO_WHARF: "Dispatch to wharf",
  AT_WHARF_COOLSTORE: "Arrived at wharf coolstore",
  LOADED_ON_VESSEL: "Loaded on vessel",
  DEPARTED: "Mark departed",
};

export function TransitionButtons({
  shipmentId,
  allowedNext,
  isPackhouse,
}: {
  shipmentId: string;
  allowedNext: ExportShipmentStatus[];
  isPackhouse: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(transitionExportShipmentAction, undefined);

  const visible = allowedNext.filter((s) => (isPackhouse ? s === "IN_TRANSIT_TO_WHARF" : s !== "IN_TRANSIT_TO_WHARF"));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {visible.map((status) => (
        <form key={status} action={action}>
          <input type="hidden" name="shipmentId" value={shipmentId} />
          <input type="hidden" name="toStatus" value={status} />
          <button
            type="submit"
            disabled={pending}
            className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
          >
            {LABELS[status]}
          </button>
        </form>
      ))}
      {state?.error ? (
        <p className="w-full text-sm font-medium text-kf-red" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
