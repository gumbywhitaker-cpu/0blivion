import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { BiosecurityRiskBadge } from "@/lib/ui/badges";

// Cross-orchard biosecurity view for a grower — the individual findings are
// also visible on the job they were logged from (app/(app)/jobs/[id]), this
// is the roll-up so a grower doesn't have to open every job to see what's
// been flagged across their whole operation.
export default async function BiosecurityPage() {
  const session = await requireSession();
  if (session.orgType !== "GROWER") redirect("/dashboard");

  const inspections = await prisma.biosecurityInspection.findMany({
    where: { orchard: { organizationId: session.organizationId } },
    include: { orchard: true, inspectedBy: true },
    orderBy: { inspectionDate: "desc" },
    take: 100,
  });

  const openFollowUps = inspections.filter((i) => i.followUpRequired);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Biosecurity</h1>
        <p className="text-kf-muted">
          Pest and disease findings across all your orchards. Log new findings from the relevant job.
        </p>
      </div>

      {openFollowUps.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Needs follow-up</h2>
          <ul className="flex flex-col gap-2">
            {openFollowUps.map((i) => (
              <li key={i.id} className="rounded-lg border border-kf-gold bg-kf-gold/10 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <BiosecurityRiskBadge riskLevel={i.riskLevel} />
                  <Link href={`/orchards/${i.orchardId}`} className="font-semibold text-kf-charcoal hover:underline">
                    {i.orchard.name}
                  </Link>
                  <span className="text-kf-muted">{i.category.replace("_", " ")}</span>
                </div>
                <p className="text-kf-charcoal">{i.findings}</p>
                <p className="font-medium text-kf-gold">
                  Follow-up due {i.followUpDate ? i.followUpDate.toISOString().slice(0, 10) : "date not set"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">All findings</h2>
        {inspections.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            No biosecurity findings logged yet. Add one from a job&apos;s detail page.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Orchard</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Findings</th>
                  <th className="px-4 py-3">Inspected by</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((i) => (
                  <tr key={i.id} className="border-b border-kf-border last:border-0">
                    <td className="px-4 py-3">{i.inspectionDate.toISOString().slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/orchards/${i.orchardId}`} className="text-kf-green-600 hover:underline">
                        {i.orchard.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{i.category.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <BiosecurityRiskBadge riskLevel={i.riskLevel} />
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={i.findings}>
                      {i.findings}
                    </td>
                    <td className="px-4 py-3">{i.inspectedBy.name}</td>
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
