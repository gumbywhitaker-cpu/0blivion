"use client";

import { useEffect } from "react";

// Registers the service worker app-wide so the browser's PWA-installability
// check (which requires an active registration with a fetch handler) passes
// on every page, not just /contractor and /driver. sw.js itself is scoped
// to caching only those two routes — registering it elsewhere doesn't widen
// what gets cached, it just satisfies the install criteria.
//
// lib/offline/useOfflineQueue.ts also registers the same script (plus a
// background-sync tag) when a contractor/driver page mounts. Registering
// the same URL twice is a no-op — the browser returns the existing
// registration — so there's no conflict between the two call sites.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort: a failed registration just means no install prompt /
      // no offline cache, never a broken app.
    });
  }, []);

  return null;
}
