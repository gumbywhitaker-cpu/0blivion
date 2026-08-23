import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { JobStatusBadge } from "@/lib/ui/badges";
import { GradingForm } from "./GradingForm";
import { AiGradingEstimate } from "./AiGradingEstimate";

// Logistics Bridge, pack house side (docs/BLUEPRINT.md: "What's arriving and
// when?"). Read-only: a pack house doesn't own these jobs and shouldn't be
// able to transition them — it's watching deliveries addressed to it.
export default async function PackhousePage() {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") redirect("/dashboard");

  const incoming = await prisma.job.findMany({
    where: {
      destinationOrgId: session.organizationId,
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    include: { orchard: true, growerOrg: true, assignedDriver: true },
    orderBy: [{ etaAt: "asc" }, { scheduledDate: "asc" }],
  });

  const arrived = await prisma.job.findMany({
    // COMPLETE and INVOICED both mean "arrived" from the pack house's point
    // of view — a job flips to INVOICED almost immediately after COMPLETE
    // (see lib/invoicing.ts), which has nothing to do with whether the load
    // physically showed up.
    where: { destinationOrgId: session.organizationId, status: { in: ["COMPLETE", "INVOICED"] } },
    include: { orchard: true, growerOrg: true, assignedDriver: true, gradingResults: true },
    orderBy: { updatedAt: "desc" },
    take: 15,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Incoming deliveries</h1>
        <p className="text-kf-muted">Transport jobs addressed to your facility.</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">On the way</h2>
        {incoming.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            Nothing incoming right now.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
                <tr>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Load</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">ETA</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {incoming.map((job) => (
                  <tr key={job.id} className="border-b border-kf-border last:border-0">
                    <td className="px-4 py-3 font-medium text-kf-charcoal">
                      {job.orchard.name} ({job.growerOrg.name})
                    </td>
                    <td className="px-4 py-3">{job.loadDescription ?? "—"}</td>
                    <td className="px-4 py-3">{job.assignedDriver?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      {job.etaAt ? job.etaAt.toISOString().slice(0, 16).replace("T", " ") : "Not set"}
                    </td>
                    <td className="px-4 py-3">
                      <JobStatusBadge status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {arrived.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Recently arrived</h2>
          <ul className="flex flex-col gap-3">
            {arrived.map((job) => {
              const grading = job.gradingResults[0];
              return (
                <li key={job.id} className="rounded-lg border border-kf-border bg-kf-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-kf-charcoal">
                      {job.orchard.name} ({job.growerOrg.name})
                    </span>
                    <span className="text-sm text-kf-muted">{job.assignedDriver?.name ?? "—"}</span>
                  </div>
                  <p className="mb-2 text-sm text-kf-muted">{job.loadDescription ?? "—"}</p>
                  {grading ? (
                    <p className="mb-2 text-sm text-kf-charcoal">
                      Graded: {grading.totalTrayEquivalents} TE
                      {grading.class1Percent != null ? ` · Class 1 ${grading.class1Percent}%` : ""}
                      {grading.class2Percent != null ? ` · Class 2 ${grading.class2Percent}%` : ""}
                      {grading.rejectPercent != null ? ` · Reject ${grading.rejectPercent}%` : ""}
                      {grading.averageBrix != null ? ` · ${grading.averageBrix}°Bx` : ""}
                    </p>
                  ) : null}
                  <div className="mb-2">
                    <AiGradingEstimate jobId={job.id} />
                  </div>
                  <GradingForm
                    jobId={job.id}
                    existing={
                      grading
                        ? {
                            gradingDate: grading.gradingDate.toISOString().slice(0, 10),
                            totalTrayEquivalents: grading.totalTrayEquivalents,
                            class1Percent: grading.class1Percent,
                            class2Percent: grading.class2Percent,
                            rejectPercent: grading.rejectPercent,
                            averageBrix: grading.averageBrix,
                            notes: grading.notes,
                          }
                        : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
