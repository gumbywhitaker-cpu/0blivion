// KiwiFlow service worker — Contractor Hub offline support only.
//
// Two jobs:
//  1. Cache-then-network for the Contractor Hub and job detail pages, so a
//     contractor who opens the app with no signal sees the last version they
//     loaded instead of a blank error page.
//  2. Best-effort Background Sync: if the browser supports it (Chrome/Android
//     — NOT Safari/iOS, which has no Background Sync implementation at all),
//     replay queued job transitions even if no tab is open. This is a bonus,
//     not the primary mechanism — lib/offline/useOfflineQueue.ts's 'online'
//     event listener is what actually has to work everywhere, since a large
//     share of field users are on iOS.
//
// Deliberately NOT a full offline-first app shell: this app is a shared,
// multi-tenant record (see kiwiflow-desktop's README for the same point) —
// caching everything would risk showing stale cross-org data. Only the
// handful of routes a contractor actually needs mid-field are cached.

const CACHE_NAME = "kiwiflow-offline-v1";
const CACHED_ROUTES = ["/contractor", "/driver"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_ROUTES).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!CACHED_ROUTES.some((route) => url.pathname === route || url.pathname.startsWith(`${route}/`))) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

// --- Minimal IndexedDB access, duplicated from lib/offline/queue.ts on
// purpose: a service worker is a separate execution context that can't
// import the app's TypeScript client bundle, so this is the smallest correct
// mirror of that file's schema rather than a shared module. Keep the two in
// sync if the schema changes.
const DB_NAME = "kiwiflow-offline";
const STORE_NAME = "pendingTransitions";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function flushQueueFromWorker() {
  let db;
  try {
    db = await openDb();
  } catch {
    return; // DB not created yet — nothing queued
  }
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    if (item.failure) continue;
    try {
      const res = await fetch("/api/v1/jobs/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: item.jobId, toStatus: item.toStatus, quantity: item.quantity, note: item.note }),
      });
      const json = await res.json();
      const tx = db.transaction(STORE_NAME, "readwrite");
      if (json.ok) {
        tx.objectStore(STORE_NAME).delete(item.localId);
      } else {
        tx.objectStore(STORE_NAME).put({ ...item, failure: { code: json.code || "unknown", error: json.error || "Rejected" } });
      }
    } catch {
      return; // still offline — the next sync event or the page's own listener will retry
    }
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "kiwiflow-flush-transitions") {
    event.waitUntil(flushQueueFromWorker());
  }
});
