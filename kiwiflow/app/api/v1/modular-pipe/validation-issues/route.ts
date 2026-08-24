import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

// GET /api/v1/modular-pipe/validation-issues — Delivery stage JSON API (spec Section
// 3.1). ?resolved=true|false filters; unfiltered returns everything.
export async function GET(request: Request) {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return Response.json({ error: "Only pack house organisations can use the Data Bridge." }, { status: 403 });
  }

  const url = new URL(request.url);
  const resolvedParam = url.searchParams.get("resolved");

  const rows = await prisma.modularPipeIssue.findMany({
    where: {
      organizationId: session.organizationId,
      ...(resolvedParam !== null ? { resolved: resolvedParam === "true" } : {}),
    },
    orderBy: [{ resolved: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
    take: 1000,
  });

  return Response.json({
    validation_issues: rows.map((r) => ({
      issue_id: r.id,
      document_id: r.documentId,
      record_type: r.recordType,
      record_id: r.recordId,
      code: r.code,
      severity: r.severity,
      message: r.message,
      field: r.field,
      suggested_action: r.suggestedAction,
      resolved: r.resolved,
      resolution_note: r.resolutionNote,
      resolved_at: r.resolvedAt?.toISOString() ?? null,
      created_at: r.createdAt.toISOString(),
    })),
  });
}
