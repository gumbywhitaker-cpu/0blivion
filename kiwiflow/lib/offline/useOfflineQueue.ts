"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllPending, flushQueue, onQueueChanged, type PendingTransition } from "./queue";

/**
 * Mount once per session (see app/(app)/OfflineSyncProvider.tsx). Flushes the
 * queue on mount (covers "app was reopened after being offline"), on every
 * browser 'online' event (the actual primary sync trigger — works on every
 * browser, unlike Background Sync which iOS Safari doesn't implement at
 * all), and registers the service worker for Background Sync as a
 * best-effort bonus on browsers that do support it.
 */
export function useOfflineQueue() {
  const [pending, setPending] = useState<PendingTransition[]>([]);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  const refresh = useCallback(async () => {
    setPending(await getAllPending());
  }, []);

  useEffect(() => {
    // Legitimate fetch-on-mount (reading IndexedDB, an external system, not
    // state derivable from props/state during render) — not the derived-state
    // anti-pattern this rule targets. If already online, also attempt a real
    // flush immediately: a stale queue from a previous session (e.g. the app
    // was closed while offline, or a prior sync attempt failed) must not sit
    // untried until the next 'online' event or the 30s poll below.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (navigator.onLine) {
      flushQueue().then(refresh);
    } else {
      refresh();
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleOnline = () => {
      setIsOnline(true);
      flushQueue().then(refresh);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const unsubscribe = onQueueChanged(refresh);

    // Best-effort: not every browser supports either API, and this must
    // never throw or block the primary online-listener path above.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if ("sync" in reg) {
            // @ts-expect-error — SyncManager isn't in the default lib.dom types
            reg.sync.register("kiwiflow-flush-transitions").catch(() => {});
          }
        })
        .catch(() => {});
    }

    // Covers the case where the tab was already open and offline when it
    // was left, then connectivity returned without a fresh 'online' event
    // firing reliably (observed on some mobile browsers backgrounding tabs).
    const interval = window.setInterval(() => {
      if (navigator.onLine) flushQueue().then(refresh);
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { pending, isOnline, refresh };
}
