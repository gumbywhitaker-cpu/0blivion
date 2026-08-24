import "server-only";
import { prisma } from "@/lib/db";
import { ISSUE_CODES, type Issue, type QualityLogRecord } from "./types";
import { normalizeIdForMatch } from "./validate";

export type CrossDocConfig = { strictCrossDocChecks: boolean };

/**
 * Cross-references a quality log's bin_ids against existing ModularPipeBinOrigin
 * records for the same organization (spec Section 2.3.1). Split out from validate.ts
 * (which stays pure/DB-free, see that file's header) because this one needs the
 * database. Block master data and a dedicated "block" table don't exist in this build
 * (KiwiFlow's Orchard model doesn't enumerate blocks separately), so "unknown_block"
 * from the spec is deliberately not implemented here rather than faked against data
 * that doesn't exist.
 */
export async function validateQualityLogCrossDoc(
  organizationId: string,
  record: QualityLogRecord,
  config: CrossDocConfig,
): Promise<Issue[]> {
  const issues: Issue[] = [];
  const severity = config.strictCrossDocChecks ? "error" : "warning";

  for (const binIdRaw of record.bin_ids) {
    const normalized = normalizeIdForMatch(binIdRaw);
    if (!normalized) continue;

    const match = await prisma.modularPipeBinOrigin.findFirst({
      where: { organizationId, binIdNormalized: normalized },
      orderBy: { createdAt: "desc" },
    });

    if (!match) {
      issues.push({
        code: ISSUE_CODES.MISSING_BIN_ORIGIN,
        severity,
        message: `Bin "${binIdRaw}" referenced in this quality log has no matching bin origin record.`,
        field: "bin_ids",
        suggested_action: "Ingest or locate the bin origin record for this bin.",
      });
      continue;
    }

    const conflicts: string[] = [];
    if (record.block_id && match.blockIdRaw && normalizeIdForMatch(record.block_id) !== normalizeIdForMatch(match.blockIdRaw)) {
      conflicts.push(`block: quality log says "${record.block_id}", bin origin says "${match.blockIdRaw}"`);
    }
    if (record.variety && match.variety && record.variety.trim().toUpperCase() !== match.variety.trim().toUpperCase()) {
      conflicts.push(`variety: quality log says "${record.variety}", bin origin says "${match.variety}"`);
    }
    if (conflicts.length > 0) {
      issues.push({
        code: ISSUE_CODES.BIN_CONFLICT,
        severity: "error",
        message: `Bin "${binIdRaw}" conflicts with its bin origin record — ${conflicts.join("; ")}. Not auto-corrected.`,
        field: "bin_ids",
        suggested_action: "Resolve manually — choose the correct value and add a note.",
      });
    }
  }

  return issues;
}
