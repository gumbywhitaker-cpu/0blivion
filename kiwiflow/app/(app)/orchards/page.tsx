import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function OrchardsPage() {
  const session = await requireSession();

  const orchards = await prisma.orchard.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { jobs: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-kf-charcoal">Orchards</h1>
        <Link
          href="/orchards/new"
          className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
        >
          + New orchard
        </Link>
      </div>

      {orchards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          No orchards yet. Add your first site to start scheduling jobs against it.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orchards.map((o) => (
            <Link
              key={o.id}
              href={`/orchards/${o.id}`}
              className="rounded-lg border border-kf-border bg-kf-card p-4 hover:border-kf-green-500"
            >
              <h2 className="font-semibold text-kf-charcoal">{o.name}</h2>
              <p className="text-sm text-kf-muted">{o.region ?? "No region set"}</p>
              <p className="mt-2 text-xs text-kf-muted">
                {o.hectares ? `${o.hectares} ha · ` : ""}
                {o._count.jobs} job{o._count.jobs === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
