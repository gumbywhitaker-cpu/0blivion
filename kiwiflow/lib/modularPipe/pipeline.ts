import "server-only";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/conductor/emit";
import { classifyAndExtract } from "./classify";
import { getOrCreateModularPipeConfig } from "./config";
import {
  ISSUE_CODES,
  PACK_VERSION,
  SCHEMA_VERSION,
  type BinOriginRecord,
  type DocumentStatus,
  type Issue,
  type QualityLogRecord,
  type RseTimesheetRecord,
} from "./types";
import { assignStatus, normalizeIdForMatch, validateBinOrigin, validateQualityLogFields, validateRseTimesheet } from "./validate";
import { validateQualityLogCrossDoc } from "./crossDocCheck";

export type IngestInput = {
  organizationId: string;
  operatorId: string | null;
  channel: "upload" | "text_blob" | "manual_entry";
  originalFilename?: string | null;
  mimeType?: string | null;
  sourceTypeHint?: string | null;
  text?: string | null;
  imageBase64?: string | null;
  imageMediaType?: string | null;
  testMode?: boolean;
};

export type PipelineRecordEntry =
  | { record_type: "quality_log"; record_id: string; record: QualityLogRecord & { block_id_normalized: string | null } }
  | { record_type: "bin_origin"; record_id: string; record: BinOriginRecord & { bin_id_normalized: string | null } }
  | {
      record_type: "rse_timesheet";
      record_id: string;
      record: RseTimesheetRecord & { total_hours_computed: number | null };
    };

export type PipelineDocumentResult = {
  document_id: string;
  source_type: string;
  status: DocumentStatus;
  records: PipelineRecordEntry[];
  errors: Issue[];
  metadata: {
    source_pack: string;
    pack_version: string;
    schema_version: string;
    claude_model_version: string | null;
    pipeline_config_version: string;
    extraction_timestamp: string;
  };
  test_summary?: {
    hard_fail_count: number;
    soft_fail_count: number;
    documents: { document_id: string; status: DocumentStatus }[];
  };
};

const PIPELINE_CONFIG_VERSION = "1";

/**
 * The full Ingestion -> Refinement -> Delivery run for one ingested unit (spec's three
 * stages). Deliberately does NOT split a "mixed" document into separate
 * ModularPipeDocument rows even though the spec's ingestion step describes doing so —
 * every extracted record already carries its own record_type and is independently
 * validated/statused, so the meaningful behavior (each logical section treated on its
 * own terms) is preserved without a second layer of document identity to keep in sync.
 * See docs/BLUEPRINT.md's Modular AI Data Bridge section for the full scope note.
 */
export async function ingestAndProcessDocument(input: IngestInput): Promise<PipelineDocumentResult> {
  const config = await getOrCreateModularPipeConfig(input.organizationId);

  const doc = await prisma.modularPipeDocument.create({
    data: {
      organizationId: input.organizationId,
      operatorId: input.operatorId,
      channel: input.channel,
      originalFilename: input.originalFilename ?? null,
      mimeType: input.mimeType ?? null,
      rawText: input.text ?? null,
      imageNote: input.imageBase64 ? "1 photo, not retained after classification" : null,
      sourceTypeProvisional: input.sourceTypeHint ?? "unknown",
      status: "unclassified",
      packVersion: PACK_VERSION,
      schemaVersion: SCHEMA_VERSION,
      pipelineConfigVersion: PIPELINE_CONFIG_VERSION,
      testMode: input.testMode ?? false,
    },
  });

  const classifyResult = await classifyAndExtract({
    documentId: doc.id,
    channel: input.channel,
    originalFilename: input.originalFilename,
    sourceTypeHint: input.sourceTypeHint,
    text: input.text,
    imageBase64: input.imageBase64,
    imageMediaType: input.imageMediaType,
    testMode: input.testMode,
  });

  if (!classifyResult.ok) {
    const issue: Issue = {
      code: ISSUE_CODES.EXTRACTION_FAILED,
      severity: "error",
      message: classifyResult.reason,
      field: null,
      suggested_action: "Retry, or enter this document's fields manually.",
    };
    await prisma.modularPipeIssue.create({
      data: {
        documentId: doc.id,
        organizationId: input.organizationId,
        recordType: "document",
        code: issue.code,
        severity: issue.severity,
        message: issue.message,
        field: issue.field ?? null,
        suggestedAction: issue.suggested_action ?? null,
      },
    });
    await prisma.modularPipeDocument.update({
      where: { id: doc.id },
      data: { status: "invalid", sourceTypeFinal: "unknown", classifiedAt: new Date() },
    });

    return buildResult(doc.id, "unknown", "invalid", [], [issue], null, input.testMode);
  }

  const modelDocs = classifyResult.response.documents.length > 0 ? classifyResult.response.documents : [];
  const overallSourceType =
    modelDocs.length > 1 ? "mixed" : (modelDocs[0]?.source_type ?? "unknown");

  const allIssues: Issue[] = [];
  const records: PipelineRecordEntry[] = [];

  for (const modelDoc of modelDocs) {
    for (const modelIssue of modelDoc.errors) {
      allIssues.push(modelIssue);
      await persistIssue(doc.id, input.organizationId, "document", null, modelIssue);
    }

    for (const entry of modelDoc.records) {
      if (entry.record_type === "quality_log") {
        const r = entry.record;
        const row = await prisma.modularPipeQualityLog.create({
          data: {
            documentId: doc.id,
            organizationId: input.organizationId,
            qualityLogIdRaw: r.quality_log_id,
            date: r.date,
            time: r.time,
            blockIdRaw: r.block_id,
            blockIdNormalized: normalizeIdForMatch(r.block_id),
            binIdsRawJson: JSON.stringify(r.bin_ids),
            variety: r.variety,
            grade: r.grade,
            defectsJson: JSON.stringify(r.defects),
            inspectorIdRaw: r.inspector_id,
            comments: r.comments,
            linkedLoadIdRaw: r.linked_load_id,
          },
        });

        const issues = [...validateQualityLogFields(r), ...(await validateQualityLogCrossDoc(input.organizationId, r, config))];
        const status = assignStatus(issues);
        await prisma.modularPipeQualityLog.update({ where: { id: row.id }, data: { status } });
        for (const issue of issues) {
          allIssues.push(issue);
          await persistIssue(doc.id, input.organizationId, "quality_log", row.id, issue);
        }
        records.push({ record_type: "quality_log", record_id: row.id, record: { ...r, block_id_normalized: row.blockIdNormalized } });
      } else if (entry.record_type === "bin_origin") {
        const r = entry.record;
        const row = await prisma.modularPipeBinOrigin.create({
          data: {
            documentId: doc.id,
            organizationId: input.organizationId,
            binIdRaw: r.bin_id ?? "",
            binIdNormalized: normalizeIdForMatch(r.bin_id),
            harvestDate: r.harvest_date,
            orchardIdRaw: r.orchard_id,
            blockIdRaw: r.block_id,
            variety: r.variety,
            pickerGroupIdRaw: r.picker_group_id,
            pickerIdsRawJson: JSON.stringify(r.picker_ids),
            loadIdRaw: r.load_id,
            destinationSiteIdRaw: r.destination_site_id,
            specialHandlingFlagsJson: JSON.stringify(r.special_handling_flags),
          },
        });

        const issues = validateBinOrigin(r);
        const status = assignStatus(issues);
        await prisma.modularPipeBinOrigin.update({ where: { id: row.id }, data: { status } });
        for (const issue of issues) {
          allIssues.push(issue);
          await persistIssue(doc.id, input.organizationId, "bin_origin", row.id, issue);
        }
        records.push({ record_type: "bin_origin", record_id: row.id, record: { ...r, bin_id_normalized: row.binIdNormalized } });
      } else if (entry.record_type === "rse_timesheet") {
        const r = entry.record;
        const { issues, totalHoursComputed } = validateRseTimesheet(r, config);
        const row = await prisma.modularPipeRseTimesheet.create({
          data: {
            documentId: doc.id,
            organizationId: input.organizationId,
            timesheetIdRaw: r.timesheet_id,
            workerIdRaw: r.worker_id,
            workerNameRaw: r.worker_name,
            workerNameNormalized: r.worker_name_normalized,
            date: r.date,
            shiftStartTime: r.shift_start_time,
            shiftEndTime: r.shift_end_time,
            breaksJson: JSON.stringify(r.breaks),
            tasksJson: JSON.stringify(r.tasks),
            totalHoursReported: r.total_hours,
            totalHoursComputed,
            overtimeHours: r.overtime_hours,
            payRate: r.pay_rate,
            supervisorIdRaw: r.supervisor_id,
            approvalsJson: JSON.stringify(r.approvals),
            status: assignStatus(issues),
          },
        });
        for (const issue of issues) {
          allIssues.push(issue);
          await persistIssue(doc.id, input.organizationId, "rse_timesheet", row.id, issue);
        }
        records.push({ record_type: "rse_timesheet", record_id: row.id, record: { ...r, total_hours_computed: totalHoursComputed } });
      }
    }
  }

  const finalStatus = assignStatus(allIssues);
  await prisma.modularPipeDocument.update({
    where: { id: doc.id },
    data: {
      sourceTypeFinal: overallSourceType,
      status: finalStatus,
      classifiedAt: new Date(),
      claudeModelVersion: classifyResult.modelVersion,
      classificationReason:
        overallSourceType === "unknown" || overallSourceType === "mixed"
          ? (allIssues.find((i) => i.code === ISSUE_CODES.CLASSIFICATION_UNCERTAIN)?.message ?? null)
          : null,
    },
  });

  if (finalStatus === "invalid") {
    await emitEvent(input.organizationId, {
      type: "MODULAR_PIPE_DOCUMENT_NEEDS_REVIEW",
      payload: {
        documentId: doc.id,
        sourceType: overallSourceType,
        errorCount: allIssues.filter((i) => i.severity === "error").length,
      },
    });
  }

  return buildResult(doc.id, overallSourceType, finalStatus, records, allIssues, classifyResult.modelVersion, input.testMode);
}

async function persistIssue(
  documentId: string,
  organizationId: string,
  recordType: "document" | "quality_log" | "bin_origin" | "rse_timesheet",
  recordId: string | null,
  issue: Issue,
): Promise<void> {
  await prisma.modularPipeIssue.create({
    data: {
      documentId,
      organizationId,
      recordType,
      recordId,
      code: issue.code,
      severity: issue.severity,
      message: issue.message,
      field: issue.field ?? null,
      suggestedAction: issue.suggested_action ?? null,
    },
  });
}

function buildResult(
  documentId: string,
  sourceType: string,
  status: DocumentStatus,
  records: PipelineRecordEntry[],
  errors: Issue[],
  modelVersion: string | null,
  testMode?: boolean,
): PipelineDocumentResult {
  const result: PipelineDocumentResult = {
    document_id: documentId,
    source_type: sourceType,
    status,
    records,
    errors,
    metadata: {
      source_pack: "packing_house",
      pack_version: PACK_VERSION,
      schema_version: SCHEMA_VERSION,
      claude_model_version: modelVersion,
      pipeline_config_version: PIPELINE_CONFIG_VERSION,
      extraction_timestamp: new Date().toISOString(),
    },
  };

  if (testMode) {
    result.test_summary = {
      hard_fail_count: status === "invalid" ? 1 : 0,
      soft_fail_count: status === "valid_with_warnings" ? 1 : 0,
      documents: [{ document_id: documentId, status }],
    };
  }

  return result;
}
