import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { UrgencyBadge } from "@/lib/ui/badges";
import { markReadAction, markAllReadAction } from "./actions";

export default async function NotificationsPage() {
  const session = await requireSession();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-kf-charcoal">Alerts</h1>
        <form action={markAllReadAction}>
          <button type="submit" className="btn text-sm font-medium text-kf-green-600 underline">
            Mark all read
          </button>
        </form>
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          Nothing yet. You&apos;ll see job, invoice and onboarding updates here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${
                n.read ? "border-kf-border bg-kf-card" : "border-kf-green-500 bg-kf-green-100"
              }`}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-semibold text-kf-charcoal">{n.title}</p>
                  <UrgencyBadge urgency={n.urgency} />
                </div>
                <p className="text-sm text-kf-charcoal/80">{n.body}</p>
                <p className="mt-1 text-xs text-kf-muted">
                  {n.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  {n.jobId ? (
                    <>
                      {" · "}
                      <Link href={`/jobs/${n.jobId}`} className="underline">
                        View job
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              {!n.read ? (
                <form action={markReadAction}>
                  <input type="hidden" name="notificationId" value={n.id} />
                  <button type="submit" className="btn shrink-0 text-xs font-medium text-kf-green-600 underline">
                    Mark read
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
