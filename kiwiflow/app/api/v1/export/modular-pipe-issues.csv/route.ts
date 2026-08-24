import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await requireSession();

  const rows = await prisma.modularPipeIssue.findMany({
    where: { organizationId: session.organizationId },
    orderBy: [{ resolved: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
  });

  const csv = toCsv(
    ["Document ID", "Record Type", "Record ID", "Code", "Severity", "Message", "Field", "Suggested Action", "Resolved", "Resolution Note"],
    rows.map((r) => [
      r.documentId,
      r.recordType,
      r.recordId ?? "",
      r.code,
      r.severity,
      r.message,
      r.field ?? "",
      r.suggestedAction ?? "",
      r.resolved ? "yes" : "no",
      r.resolutionNote ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-modular-pipe-issues-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
