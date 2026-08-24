// Modular AI Data Bridge — shared types and schemas for the Packing House Pack.
//
// Mirrors the "Domain schemas" and "Output format" sections of the pipeline spec.
// Kept separate from prisma/schema.prisma the same way lib/types.ts is separate from
// the rest of the data model: these are the wire/contract shapes the AI call and the
// UI both speak, not the persisted row shapes (see pipeline.ts for the mapping between
// the two — a document can legitimately extract a field the Prisma row doesn't carry
// as a first-class column, and that's fine as long as it round-trips through JSON).

import { z } from "zod";

// -----------------------------------------------------------------------------------
// Pack identity
// -----------------------------------------------------------------------------------

// Only the Packing House Pack is actually implemented. "Modular by design" here means
// the tables, pipeline stages, and config shape are pack-agnostic — a future
// trucking/port-logistics pack would reuse ModularPipeDocument/ModularPipeIssue and add
// its own domain-record tables and a new prompt module, not a rewrite. It does NOT mean
// a second pack ships in this codebase yet; ACTIVE_PACKS below is deliberately a list of
// one, not a promise.
export const ACTIVE_PACKS = ["packing_house"] as const;
export type ActivePack = (typeof ACTIVE_PACKS)[number];

export const PACK_VERSION = "packing_house_pack_v1.0.0";
export const SCHEMA_VERSION = "1.0.0";

// -----------------------------------------------------------------------------------
// Ingestion
// -----------------------------------------------------------------------------------

// email/api are documented in the spec as future channels; only upload (file) and
// text_blob (paste) are actually wired to an ingest path in this build.
export const INGESTION_CHANNELS = ["upload", "text_blob", "manual_entry"] as const;
export type IngestionChannel = (typeof INGESTION_CHANNELS)[number];

export const SOURCE_TYPES = ["quality_log", "bin_origin", "rse_timesheet", "mixed", "unknown"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const DOCUMENT_STATUSES = ["valid", "valid_with_warnings", "invalid", "unclassified"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const ISSUE_SEVERITIES = ["warning", "error"] as const;
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export const RECORD_TYPES = ["quality_log", "bin_origin", "rse_timesheet", "document"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

// -----------------------------------------------------------------------------------
// Domain schemas (spec Section 2.1) — what the model is asked to extract.
// Every field is nullable: a missing/ambiguous value must come back as null with an
// issue explaining why, never a guess (the pipeline's one non-negotiable rule).
// -----------------------------------------------------------------------------------

const defectSchema = z.object({
  defect_type: z.string().nullable(),
  severity: z.string().nullable(),
  count_or_percentage: z.union([z.number(), z.string()]).nullable(),
});
export type Defect = z.infer<typeof defectSchema>;

export const qualityLogSchema = z.object({
  quality_log_id: z.string().nullable(),
  date: z.string().nullable(), // ISO YYYY-MM-DD once normalized, or null if ambiguous
  time: z.string().nullable(), // ISO HH:MM (24h) once normalized, or null if ambiguous
  block_id: z.string().nullable(),
  bin_ids: z.array(z.string()).default([]),
  variety: z.string().nullable(),
  grade: z.string().nullable(),
  defects: z.array(defectSchema).default([]),
  inspector_id: z.string().nullable(),
  comments: z.string().nullable(),
  linked_load_id: z.string().nullable(),
});
export type QualityLogRecord = z.infer<typeof qualityLogSchema>;

export const binOriginSchema = z.object({
  bin_id: z.string().nullable(),
  harvest_date: z.string().nullable(),
  orchard_id: z.string().nullable(),
  block_id: z.string().nullable(),
  variety: z.string().nullable(),
  picker_group_id: z.string().nullable(),
  picker_ids: z.array(z.string()).default([]),
  load_id: z.string().nullable(),
  destination_site_id: z.string().nullable(),
  special_handling_flags: z.array(z.string()).default([]),
});
export type BinOriginRecord = z.infer<typeof binOriginSchema>;

const breakSchema = z.object({
  break_start: z.string().nullable(),
  break_end: z.string().nullable(),
});
const taskSchema = z.object({
  task_type: z.string().nullable(),
  block_id: z.string().nullable(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
});

export const rseTimesheetSchema = z.object({
  timesheet_id: z.string().nullable(),
  worker_id: z.string().nullable(),
  worker_name: z.string().nullable(),
  worker_name_normalized: z.string().nullable(),
  date: z.string().nullable(),
  shift_start_time: z.string().nullable(),
  shift_end_time: z.string().nullable(),
  breaks: z.array(breakSchema).default([]),
  tasks: z.array(taskSchema).default([]),
  total_hours: z.number().nullable(), // as read off the sheet — never invented if absent
  overtime_hours: z.number().nullable(),
  pay_rate: z.number().nullable(), // null unless actually visible — payroll safety
  supervisor_id: z.string().nullable(),
  approvals: z.array(z.string()).default([]),
});
export type RseTimesheetRecord = z.infer<typeof rseTimesheetSchema>;

// -----------------------------------------------------------------------------------
// Error / issue shape (spec Section 2.4, Step 5)
// -----------------------------------------------------------------------------------

export const issueSchema = z.object({
  code: z.string(),
  severity: z.enum(ISSUE_SEVERITIES),
  message: z.string(),
  field: z.string().nullable().optional(),
  suggested_action: z.string().nullable().optional(),
});
export type Issue = z.infer<typeof issueSchema>;

// -----------------------------------------------------------------------------------
// Top-level model output contract (Super Prompt "Output format")
// -----------------------------------------------------------------------------------

const recordsUnionSchema = z.union([
  z.object({ record_type: z.literal("quality_log"), record: qualityLogSchema }),
  z.object({ record_type: z.literal("bin_origin"), record: binOriginSchema }),
  z.object({ record_type: z.literal("rse_timesheet"), record: rseTimesheetSchema }),
]);

export const modelDocumentSchema = z.object({
  document_id: z.string(),
  source_type: z.enum(SOURCE_TYPES),
  status: z.enum(["valid", "valid_with_warnings", "invalid"]),
  records: z.array(recordsUnionSchema).default([]),
  errors: z.array(issueSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ModelDocument = z.infer<typeof modelDocumentSchema>;

export const modelResponseSchema = z.object({
  documents: z.array(modelDocumentSchema),
});
export type ModelResponse = z.infer<typeof modelResponseSchema>;

// -----------------------------------------------------------------------------------
// Known error codes referenced directly by lib/modularPipe/validate.ts. Not an
// exhaustive enum — the model can also emit its own codes at extraction time — but
// keeping the ones the deterministic validator relies on named here means a typo in
// validate.ts is caught by the type checker rather than silently never matching.
// -----------------------------------------------------------------------------------

export const ISSUE_CODES = {
  MISSING_BIN_ORIGIN: "missing_bin_origin",
  UNKNOWN_BLOCK: "unknown_block",
  BIN_CONFLICT: "bin_conflict",
  AMBIGUOUS_DATE: "ambiguous_date",
  MISSING_MANDATORY_FIELD: "missing_mandatory_field",
  HOURS_MISMATCH: "hours_mismatch",
  SHIFT_TOO_LONG: "shift_too_long",
  SHIFT_NEGATIVE_DURATION: "shift_negative_duration",
  WORKER_UNRESOLVED: "worker_unresolved",
  LOW_OCR_CONFIDENCE: "low_ocr_confidence",
  CLASSIFICATION_UNCERTAIN: "classification_uncertain",
  EXTRACTION_FAILED: "extraction_failed",
} as const;
