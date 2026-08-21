import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { NewJobForm } from "./NewJobForm";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ orchardId?: string }>;
}) {
  const session = await requireSession();
  const { orchardId } = await searchParams;

  if (session.orgType !== "GROWER") {
    return (
      <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
        Only grower organisations schedule jobs.
      </p>
    );
  }

  const [orchards, links, packhouses] = await Promise.all([
    prisma.orchard.findMany({ where: { organizationId: session.organizationId }, orderBy: { name: "asc" } }),
    prisma.contractorLink.findMany({
      where: { growerOrgId: session.organizationId, status: "ACTIVE" },
      include: { contractorOrg: true },
    }),
    prisma.organization.findMany({ where: { type: "PACKHOUSE" }, orderBy: { name: "asc" } }),
  ]);

  if (orchards.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
        Add an orchard before scheduling a job.
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-kf-charcoal">Schedule a job</h1>
      <NewJobForm
        orchards={orchards.map((o) => ({ id: o.id, name: o.name }))}
        contractors={links.map((l) => ({ id: l.contractorOrgId, name: l.contractorOrg.name }))}
        packhouses={packhouses.map((p) => ({ id: p.id, name: p.name }))}
        defaultOrchardId={orchardId}
      />
    </div>
  );
}
