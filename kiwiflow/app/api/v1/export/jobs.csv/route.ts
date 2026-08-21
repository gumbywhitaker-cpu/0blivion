import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

// GET /api/v1/export/jobs.csv — accountant-readable column headers, org-scoped.
export async function GET() {
  const session = await requireSession();

  const where =
    session.orgType === "GROWER"
      ? { growerOrgId: session.organizationId }
      : session.orgType === "CONTRACTOR"
        ? { contractorOrgId: session.organizationId }
        : { id: "__none__" };

  const jobs = await prisma.job.findMany({
    where,
    include: { orchard: true, growerOrg: true, contractorOrg: true },
    orderBy: { scheduledDate: "desc" },
  });

  const csv = toCsv(
    [
      "Job ID",
      "Date",
      "Orchard",
      "Grower",
      "Contractor",
      "Job Type",
      "Status",
      "Priority",
      "Quantity",
      "Unit",
      "Rate",
    ],
    jobs.map((j) => [
      j.id,
      j.scheduledDate.toISOString().slice(0, 10),
      j.orchard.name,
      j.growerOrg.name,
      j.contractorOrg?.name ?? "",
      j.jobType,
      j.status,
      j.priority,
      j.quantity ?? "",
      j.unit ?? "",
      j.rate ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-jobs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
