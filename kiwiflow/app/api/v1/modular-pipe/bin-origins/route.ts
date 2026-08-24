import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PACK_VERSION, SCHEMA_VERSION } from "@/lib/modularPipe/types";

// GET /api/v1/modular-pipe/bin-origins — Delivery stage JSON API (spec Section 3.1).
export async function GET() {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return Response.json({ error: "Only pack house organisations can use the Data Bridge." }, { status: 403 });
  }

  const rows = await prisma.modularPipeBinOrigin.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return Response.json({
    source_pack: "packing_house",
    pack_version: PACK_VERSION,
    schema_version: SCHEMA_VERSION,
    bin_origins: rows.map((r) => ({
      record_id: r.id,
      document_id: r.documentId,
      bin_id: r.binIdRaw,
      bin_id_normalized: r.binIdNormalized,
      harvest_date: r.harvestDate,
      orchard_id: r.orchardIdRaw,
      block_id: r.blockIdRaw,
      variety: r.variety,
      picker_group_id: r.pickerGroupIdRaw,
      picker_ids: JSON.parse(r.pickerIdsRawJson),
      load_id: r.loadIdRaw,
      destination_site_id: r.destinationSiteIdRaw,
      special_handling_flags: JSON.parse(r.specialHandlingFlagsJson),
      status: r.status,
    })),
  });
}
