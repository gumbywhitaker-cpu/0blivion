import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function CrewsPage() {
  const session = await requireSession();

  if (session.orgType !== "CONTRACTOR") {
    return (
      <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
        Crew management is only available for contractor organisations.
      </p>
    );
  }

  const crews = await prisma.crew.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true, jobs: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-kf-charcoal">Crews</h1>
        <div className="flex items-center gap-3">
          <a
            href="/api/v1/export/payroll.csv"
            className="text-sm font-medium text-kf-green-600 hover:underline"
          >
            Export payroll CSV
          </a>
          <Link
            href="/crews/new"
            className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
          >
            + New crew
          </Link>
        </div>
      </div>

      {crews.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          No crews yet. Create one to start assigning workers to jobs.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {crews.map((crew) => (
            <Link
              key={crew.id}
              href={`/crews/${crew.id}`}
              className="rounded-lg border border-kf-border bg-kf-card p-4 hover:border-kf-green-500"
            >
              <h2 className="font-semibold text-kf-charcoal">{crew.name}</h2>
              <p className="mt-2 text-xs text-kf-muted">
                {crew._count.members} member{crew._count.members === 1 ? "" : "s"} ·{" "}
                {crew._count.jobs} job{crew._count.jobs === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
