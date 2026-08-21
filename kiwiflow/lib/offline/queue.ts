"use client";

/**
 * IndexedDB-backed queue for job status transitions made while offline.
 * Client-only (Contractor Hub field use) — never imported from a Server
 * Component or Server Action.
 *
 * This is the honest scope: it queues Contractor Hub job transitions
 * (accept/start/complete), not arbitrary app state. See
 * docs/BLUEPRINT.md's Logistics/offline note and lib/jobTransition.ts for
 * why a stable REST endpoint (not a Server Action) is what gets replayed.
 */

const DB_NAME = "kiwiflow-offline";
const DB_VERSION = 1;
const STORE_NAME = "pendingTransitions";

export type PendingTransition = {
  localId: string;
  jobId: string;
  toStatus: string;
  quantity?: number;
  note?: string;
  jobLabel: string; // human-readable, for the pending-queue UI — e.g. "HARVEST — Smith Orchard"
  queuedAt: string;
  // Set once a replay attempt gets a real rejection from the server (not a
  // network failure) — e.g. someone else already completed the job from
  // another device. Kept in the queue, not silently dropped, so the user
  // sees exactly what didn't apply and why.
  failure?: { code: string; error: string };
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function enqueueTransition(item: Omit<PendingTransition, "localId" | "queuedAt">): Promise<void> {
  const record: PendingTransition = {
    ...item,
    localId: `${item.jobId}-${item.toStatus}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
  };
  await withStore("readwrite", (store) => store.put(record));
  notifyQueueChanged();
}

export async function getAllPending(): Promise<PendingTransition[]> {
  return withStore("readonly", (store) => store.getAll());
}

export async function removePending(localId: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(localId));
  notifyQueueChanged();
}

export async function markFailed(localId: string, failure: { code: string; error: string }): Promise<void> {
  const all = await getAllPending();
  const item = all.find((i) => i.localId === localId);
  if (!item) return;
  await withStore("readwrite", (store) => store.put({ ...item, failure }));
  notifyQueueChanged();
}

const QUEUE_CHANGED_EVENT = "kiwiflow-offline-queue-changed";

function notifyQueueChanged(): void {
  window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
}

export function onQueueChanged(handler: () => void): () => void {
  window.addEventListener(QUEUE_CHANGED_EVENT, handler);
  return () => window.removeEventListener(QUEUE_CHANGED_EVENT, handler);
}

/**
 * Replays every queued transition against the real API route. Stops at the
 * first network failure (still offline) rather than looping — the rest stay
 * queued for the next trigger. A structured rejection (job moved on,
 * permission denied) is NOT a network failure: that item is marked failed
 * and left visible, and the loop continues to the next item.
 */
export async function flushQueue(): Promise<void> {
  const pending = await getAllPending();
  for (const item of pending) {
    if (item.failure) continue; // already surfaced to the user — needs manual dismissal, not auto-retry
    try {
      const res = await fetch("/api/v1/jobs/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: item.jobId, toStatus: item.toStatus, quantity: item.quantity, note: item.note }),
      });
      const json = await res.json();
      if (json.ok) {
        await removePending(item.localId);
      } else {
        await markFailed(item.localId, { code: json.code ?? "unknown", error: json.error ?? "Rejected by server" });
      }
    } catch {
      // Network failure — still offline (or the server is down). Stop here;
      // the online listener or next manual trigger will retry the whole queue.
      return;
    }
  }
}
