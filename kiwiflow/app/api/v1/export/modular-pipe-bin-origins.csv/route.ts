import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await requireSession();

  const rows = await prisma.modularPipeBinOrigin.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Bin ID", "Harvest Date", "Orchard", "Block", "Variety", "Picker Group", "Load", "Destination", "Status"],
    rows.map((r) => [
      r.binIdRaw,
      r.harvestDate ?? "",
      r.orchardIdRaw ?? "",
      r.blockIdRaw ?? "",
      r.variety ?? "",
      r.pickerGroupIdRaw ?? "",
      r.loadIdRaw ?? "",
      r.destinationSiteIdRaw ?? "",
      r.status,
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-modular-pipe-bin-origins-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
