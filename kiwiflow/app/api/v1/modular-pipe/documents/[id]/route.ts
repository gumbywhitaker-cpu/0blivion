import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

// GET /api/v1/modular-pipe/documents/[id] — side-by-side detail data for God Mode's
// exception queue (spec Section 4.3): original doc content, extracted records, and
// open issues, all org-scoped.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return Response.json({ error: "Only pack house organisations can use the Data Bridge." }, { status: 403 });
  }
  const { id } = await params;

  const doc = await prisma.modularPipeDocument.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      qualityLogs: true,
      binOrigins: true,
      rseTimesheets: true,
      issues: { orderBy: [{ resolved: "asc" }, { severity: "desc" }, { createdAt: "asc" } ] },
      operator: { select: { name: true, email: true } },
    },
  });
  if (!doc) return Response.json({ error: "Document not found." }, { status: 404 });

  return Response.json({
    document_id: doc.id,
    source_type: doc.sourceTypeFinal ?? doc.sourceTypeProvisional,
    status: doc.status,
    channel: doc.channel,
    original_filename: doc.originalFilename,
    original_text: doc.rawText,
    image_note: doc.imageNote,
    operator: doc.operator ? { name: doc.operator.name, email: doc.operator.email } : null,
    timestamp_received: doc.timestampReceived.toISOString(),
    classified_at: doc.classifiedAt?.toISOString() ?? null,
    classification_reason: doc.classificationReason,
    metadata: {
      source_pack: "packing_house",
      pack_version: doc.packVersion,
      schema_version: doc.schemaVersion,
      claude_model_version: doc.claudeModelVersion,
      pipeline_config_version: doc.pipelineConfigVersion,
    },
    records: {
      quality_logs: doc.qualityLogs,
      bin_origins: doc.binOrigins,
      rse_timesheets: doc.rseTimesheets,
    },
    issues: doc.issues,
  });
}
