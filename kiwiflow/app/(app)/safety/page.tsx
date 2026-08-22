import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SafetySeverityBadge } from "@/lib/ui/badges";

// Cross-orchard H&S view for a grower — individual reports are also visible
// on the job they were logged from (app/(app)/jobs/[id]), this is the
// roll-up so a grower doesn't have to open every job to see what's been
// flagged across their whole operation.
export default async function SafetyPage() {
  const session = await requireSession();
  if (session.orgType !== "GROWER") redirect("/dashboard");

  const incidents = await prisma.safetyIncident.findMany({
    where: { orchard: { organizationId: session.organizationId } },
    include: { orchard: true, reportedBy: true },
    orderBy: { incidentDate: "desc" },
    take: 100,
  });

  const openFollowUps = incidents.filter((i) => i.followUpRequired);
  const critical = incidents.filter((i) => i.severity === "CRITICAL");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Health &amp; Safety</h1>
        <p className="text-kf-muted">
          Hazards, near misses, and incidents across all your orchards. Log new reports from the relevant
          job. This is KiwiFlow&apos;s own record — it does not submit anything to WorkSafe.
        </p>
      </div>

      {critical.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-red">Critical — check your notification obligations</h2>
          <ul className="flex flex-col gap-2">
            {critical.map((i) => (
              <li key={i.id} className="rounded-lg border border-kf-red bg-kf-red/5 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <SafetySeverityBadge severity={i.severity} />
                  <Link href={`/orchards/${i.orchardId}`} className="font-semibold text-kf-charcoal hover:underline">
                    {i.orchard.name}
                  </Link>
                  <span className="text-kf-muted">{i.type.replace("_", " ")}</span>
                </div>
                <p className="text-kf-charcoal">{i.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {openFollowUps.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Needs follow-up</h2>
          <ul className="flex flex-col gap-2">
            {openFollowUps.map((i) => (
              <li key={i.id} className="rounded-lg border border-kf-gold bg-kf-gold/10 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <SafetySeverityBadge severity={i.severity} />
                  <Link href={`/orchards/${i.orchardId}`} className="font-semibold text-kf-charcoal hover:underline">
                    {i.orchard.name}
                  </Link>
                  <span className="text-kf-muted">{i.type.replace("_", " ")}</span>
                </div>
                <p className="text-kf-charcoal">{i.description}</p>
                <p className="font-medium text-kf-gold">
                  Follow-up due {i.followUpDate ? i.followUpDate.toISOString().slice(0, 10) : "date not set"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">All reports</h2>
        {incidents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            No H&amp;S reports logged yet. Add one from a job&apos;s detail page.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Orchard</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Reported by</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => (
                  <tr key={i.id} className="border-b border-kf-border last:border-0">
                    <td className="px-4 py-3">{i.incidentDate.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/orchards/${i.orchardId}`} className="text-kf-green-600 hover:underline">
                        {i.orchard.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{i.type.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <SafetySeverityBadge severity={i.severity} />
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={i.description}>
                      {i.description}
                    </td>
                    <td className="px-4 py-3">{i.reportedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
