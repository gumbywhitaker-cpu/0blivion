import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { applyJobTransition } from "@/lib/jobTransition";

/**
 * POST /api/v1/jobs/transition — the offline-capable twin of transitionJobAction
 * (app/(app)/jobs/actions.ts). Exists specifically because Server Actions can't
 * be the target of an offline queue: their endpoint is an opaque, per-build
 * action ID, not a stable URL, so a request queued in IndexedDB while offline
 * has nothing reliable to replay against once the build changes. This route is
 * a stable URL a service worker can retry indefinitely. Same session cookie,
 * same applyJobTransition() core — see lib/jobTransition.ts.
 *
 * Deliberately NOT requireSession(): that redirects on failure, which is right
 * for a page load but wrong for a fetch() call — this returns a real 401 JSON
 * body so the offline queue can tell "not logged in" apart from "offline"
 * apart from "the transition itself was rejected".
 */

const bodySchema = z.object({
  jobId: z.string().min(1),
  toStatus: z.string().min(1),
  quantity: z.number().positive().optional(),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, code: "unauthenticated", error: "Not signed in" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "validation", error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "validation", error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const outcome = await applyJobTransition(session, parsed.data);
  if (!outcome.ok) {
    const status = outcome.code === "not_found" ? 404 : outcome.code === "forbidden" ? 403 : 409;
    return NextResponse.json(outcome, { status });
  }

  return NextResponse.json(outcome);
}
