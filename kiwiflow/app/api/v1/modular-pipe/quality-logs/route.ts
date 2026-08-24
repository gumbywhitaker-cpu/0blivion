import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PACK_VERSION, SCHEMA_VERSION } from "@/lib/modularPipe/types";

// GET /api/v1/modular-pipe/quality-logs — Delivery stage JSON API (spec Section 3.1).
export async function GET() {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return Response.json({ error: "Only pack house organisations can use the Data Bridge." }, { status: 403 });
  }

  const rows = await prisma.modularPipeQualityLog.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return Response.json({
    source_pack: "packing_house",
    pack_version: PACK_VERSION,
    schema_version: SCHEMA_VERSION,
    quality_logs: rows.map((r) => ({
      record_id: r.id,
      document_id: r.documentId,
      quality_log_id: r.qualityLogIdRaw,
      date: r.date,
      time: r.time,
      block_id: r.blockIdRaw,
      block_id_normalized: r.blockIdNormalized,
      bin_ids: JSON.parse(r.binIdsRawJson),
      variety: r.variety,
      grade: r.grade,
      defects: JSON.parse(r.defectsJson),
      inspector_id: r.inspectorIdRaw,
      comments: r.comments,
      linked_load_id: r.linkedLoadIdRaw,
      status: r.status,
    })),
  });
}
