import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

// GET /api/v1/export/spray-diary.csv — the audit trail NZS 8409:2021 / Zespri's
// Crop Protection Standard expects to exist, in one downloadable file instead of a
// paper diary.
export async function GET() {
  const session = await requireSession();

  const entries = await prisma.sprayDiaryEntry.findMany({
    where: {
      job: {
        OR: [{ growerOrgId: session.organizationId }, { contractorOrgId: session.organizationId }],
      },
    },
    include: { orchard: true, applicator: true },
    orderBy: { applicationDate: "desc" },
  });

  const csv = toCsv(
    [
      "Orchard",
      "Product",
      "Active Ingredient",
      "HSR Number",
      "Rate",
      "Unit",
      "Area (ha)",
      "Target",
      "Weather",
      "Application Date",
      "Withholding Period (days)",
      "Harvest Safe From",
      "Applicator",
    ],
    entries.map((e) => [
      e.orchard.name,
      e.productName,
      e.activeIngredient ?? "",
      e.hsrNumber ?? "",
      e.rateApplied,
      e.rateUnit,
      e.areaTreatedHa ?? "",
      e.targetPestOrDisease ?? "",
      e.weatherConditions ?? "",
      e.applicationDate.toISOString().slice(0, 10),
      e.withholdingPeriodDays ?? "",
      e.harvestSafeDate ? e.harvestSafeDate.toISOString().slice(0, 10) : "",
      e.applicator.name,
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-spray-diary-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
