"use client";

import { useOfflineQueue } from "./useOfflineQueue";
import { flushQueue, removePending } from "./queue";

/** Mounted once in app/(app)/layout.tsx, gated to CONTRACTOR orgs and DRIVER
 * users — the only roles this offline path targets. Shows nothing when
 * there's nothing queued and the device is online, so it's invisible for
 * everyone else's normal, connected use of the app. */
export function OfflineIndicator() {
  const { pending, isOnline, refresh } = useOfflineQueue();

  const failed = pending.filter((p) => p.failure);
  const waiting = pending.filter((p) => !p.failure);

  if (isOnline && pending.length === 0) return null;

  return (
    <div className="border-b border-kf-gold bg-kf-gold/10 px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {!isOnline ? (
            <span className="font-semibold text-kf-charcoal">Offline</span>
          ) : null}
          {waiting.length > 0 ? (
            <span className="text-kf-charcoal">
              {waiting.length} update{waiting.length === 1 ? "" : "s"} queued — will sync when back online
            </span>
          ) : null}
          {failed.length > 0 ? (
            <span className="font-medium text-kf-red">
              {failed.length} update{failed.length === 1 ? "" : "s"} couldn&apos;t be applied
            </span>
          ) : null}
        </div>
        {isOnline && waiting.length > 0 ? (
          <button
            type="button"
            className="btn rounded-md border border-kf-border bg-white px-3 py-1 text-xs font-medium text-kf-charcoal hover:border-kf-green-500"
            onClick={() => flushQueue().then(refresh)}
          >
            Sync now
          </button>
        ) : null}
      </div>
      {failed.length > 0 ? (
        <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-1">
          {failed.map((f) => (
            <div key={f.localId} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs">
              <span className="text-kf-charcoal">
                {f.jobLabel} → {f.toStatus}: {f.failure!.error}
              </span>
              <button
                type="button"
                className="btn font-medium text-kf-red underline"
                onClick={() => removePending(f.localId).then(refresh)}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
