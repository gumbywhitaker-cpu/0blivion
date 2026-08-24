import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

// GET /api/v1/modular-pipe/documents — the queue listing behind God Mode's
// unclassified_docs / needs_review / conflicts views (spec Section 4.3). Filters:
// ?status=unclassified|invalid|valid_with_warnings|valid, ?sourceType=..., ?severity=warning|error
export async function GET(request: Request) {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return Response.json({ error: "Only pack house organisations can use the Data Bridge." }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const sourceType = url.searchParams.get("sourceType");
  const severity = url.searchParams.get("severity");

  const documents = await prisma.modularPipeDocument.findMany({
    where: {
      organizationId: session.organizationId,
      ...(status ? { status } : {}),
      ...(sourceType ? { sourceTypeFinal: sourceType } : {}),
      ...(severity ? { issues: { some: { severity, resolved: false } } } : {}),
    },
    include: { _count: { select: { issues: { where: { resolved: false } } } } },
    orderBy: { timestampReceived: "desc" },
    take: 200,
  });

  return Response.json({
    documents: documents.map((d) => ({
      document_id: d.id,
      source_type: d.sourceTypeFinal ?? d.sourceTypeProvisional,
      status: d.status,
      channel: d.channel,
      original_filename: d.originalFilename,
      timestamp_received: d.timestampReceived.toISOString(),
      classified_at: d.classifiedAt?.toISOString() ?? null,
      open_issue_count: d._count.issues,
    })),
  });
}
