import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await requireSession();

  const rows = await prisma.modularPipeQualityLog.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Quality Log ID", "Date", "Time", "Block", "Bin IDs", "Variety", "Grade", "Inspector", "Linked Load", "Status", "Comments"],
    rows.map((r) => [
      r.qualityLogIdRaw ?? "",
      r.date ?? "",
      r.time ?? "",
      r.blockIdRaw ?? "",
      (JSON.parse(r.binIdsRawJson) as string[]).join("; "),
      r.variety ?? "",
      r.grade ?? "",
      r.inspectorIdRaw ?? "",
      r.linkedLoadIdRaw ?? "",
      r.status,
      r.comments ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-modular-pipe-quality-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
