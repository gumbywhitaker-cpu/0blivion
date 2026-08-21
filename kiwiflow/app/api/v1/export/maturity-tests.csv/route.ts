import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

// GET /api/v1/export/maturity-tests.csv
export async function GET() {
  const session = await requireSession();

  const tests = await prisma.harvestMaturityTest.findMany({
    where: {
      job: {
        OR: [{ growerOrgId: session.organizationId }, { contractorOrgId: session.organizationId }],
      },
    },
    include: { orchard: true, recordedBy: true },
    orderBy: { testDate: "desc" },
  });

  const csv = toCsv(
    [
      "Orchard",
      "Variety",
      "Test Date",
      "Brix",
      "Min Brix Required",
      "Dry Matter %",
      "Min Dry Matter Required",
      "Sample Size",
      "Result",
      "Lab / Tester",
      "Recorded By",
    ],
    tests.map((t) => [
      t.orchard.name,
      t.variety,
      t.testDate.toISOString().slice(0, 10),
      t.brix,
      t.minBrixRequired ?? "",
      t.dryMatterPercent ?? "",
      t.minDryMatterRequired ?? "",
      t.sampleSize ?? "",
      t.passed ? "PASS" : "FAIL",
      t.labOrTester ?? "",
      t.recordedBy.name,
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-maturity-tests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
