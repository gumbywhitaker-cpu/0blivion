import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ComposeBroadcastForm } from "./ComposeBroadcastForm";

export default async function BroadcastsPage() {
  const session = await requireSession();

  if (session.orgType === "GROWER") {
    const [links, sent] = await Promise.all([
      prisma.contractorLink.findMany({
        where: { growerOrgId: session.organizationId, status: "ACTIVE" },
        include: { contractorOrg: true },
      }),
      prisma.broadcast.findMany({
        where: { organizationId: session.organizationId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { recipients: { include: { organization: true } }, createdBy: true },
      }),
    ]);

    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-kf-charcoal">Broadcasts</h1>
          <p className="text-kf-muted">Send one message to some or all of your linked contractors at once.</p>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Compose</h2>
          <ComposeBroadcastForm
            contractors={links.map((l) => ({ id: l.contractorOrgId, name: l.contractorOrg.name }))}
          />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Sent</h2>
          {sent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
              No broadcasts sent yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sent.map((b) => (
                <div key={b.id} className="rounded-lg border border-kf-border bg-kf-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-kf-charcoal">{b.title}</p>
                      <p className="text-sm text-kf-muted">{b.body}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-kf-green-100 px-2.5 py-1 text-xs font-semibold text-kf-green-700">
                      {b.urgency}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-kf-muted">
                    Sent to {b.recipients.length} contractor{b.recipients.length === 1 ? "" : "s"} by {b.createdBy.name} ·{" "}
                    {b.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                  <p className="mt-1 text-xs text-kf-muted">
                    {b.recipients.map((r) => r.organization.name).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // Any other org type (contractors, mainly): read-only inbox of broadcasts
  // addressed to them, newest first.
  const received = await prisma.broadcastRecipient.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { broadcast: { include: { organization: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Broadcasts</h1>
        <p className="text-kf-muted">Messages sent to your organisation by growers you work with.</p>
      </div>

      {received.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          No broadcasts yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {received.map((r) => (
            <div key={r.id} className="rounded-lg border border-kf-border bg-kf-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-kf-charcoal">{r.broadcast.title}</p>
                  <p className="text-sm text-kf-muted">{r.broadcast.body}</p>
                </div>
                <span className="shrink-0 rounded-full bg-kf-green-100 px-2.5 py-1 text-xs font-semibold text-kf-green-700">
                  {r.broadcast.urgency}
                </span>
              </div>
              <p className="mt-2 text-xs text-kf-muted">
                From {r.broadcast.organization.name} · {r.broadcast.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
