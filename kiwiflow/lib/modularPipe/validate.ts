import { ISSUE_CODES, type BinOriginRecord, type Issue, type QualityLogRecord, type RseTimesheetRecord } from "./types";
import type { DocumentStatus } from "./types";

// Deliberately no "server-only" guard and no database import here (unlike
// crossDocCheck.ts): every function below is pure and side-effect free, which is what
// lets the Zero Defect Testing Suite (lib/modularPipe/goldset/) run these as plain unit
// tests via `tsx`, outside a Next.js server request, with no DB or network involved.

/**
 * Deterministic re-validation — the part of the pipeline the spec's "never let Claude
 * invent totals" and "no guessing on business critical data" rules actually bind. The
 * model (classify.ts) extracts fields and may propose its own errors[], but anything
 * that decides money, hours, or a cross-record conflict is recomputed here in plain
 * TypeScript and the model's opinion is discarded in favor of this. This is the same
 * "AI can only act through code the app controls" posture docs/BLUEPRINT.md Section 13
 * lays out for the (deferred) AI layer, applied to a feature that's actually shipping.
 */

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = TIME_RE.exec(time.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function normalizeIdForMatch(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, "");
  return trimmed || null;
}

export type ComputedHours = { hours: number | null; issues: Issue[] };

/**
 * Sums shift segments minus breaks, in minutes, then converts to hours (2dp). Returns
 * null (with an issue explaining why) whenever a time can't be parsed or the shift is
 * structurally invalid — never a best-guess number, per spec Section 2.3.2/3.1.
 */
export function computeShiftHours(
  shiftStart: string | null,
  shiftEnd: string | null,
  breaks: { break_start: string | null; break_end: string | null }[],
): ComputedHours {
  const issues: Issue[] = [];
  const startMin = parseTimeToMinutes(shiftStart);
  const endMin = parseTimeToMinutes(shiftEnd);

  if (startMin === null || endMin === null) {
    issues.push({
      code: ISSUE_CODES.MISSING_MANDATORY_FIELD,
      severity: "error",
      message: "Shift start/end time is missing or not a recognizable 24-hour time — total hours cannot be computed.",
      field: "shift_start_time/shift_end_time",
      suggested_action: "Re-enter shift start and end time as HH:MM.",
    });
    return { hours: null, issues };
  }

  if (endMin <= startMin) {
    issues.push({
      code: ISSUE_CODES.SHIFT_NEGATIVE_DURATION,
      severity: "error",
      message: `Shift end time (${shiftEnd}) is not after start time (${shiftStart}).`,
      field: "shift_end_time",
      suggested_action: "Confirm the correct start/end time; an overnight shift must still be entered as later-than-start on the same record.",
    });
    return { hours: null, issues };
  }

  let breakMinutes = 0;
  for (const brk of breaks) {
    const bStart = parseTimeToMinutes(brk.break_start);
    const bEnd = parseTimeToMinutes(brk.break_end);
    if (bStart === null || bEnd === null) {
      issues.push({
        code: ISSUE_CODES.MISSING_MANDATORY_FIELD,
        severity: "warning",
        message: "A break's start/end time isn't a recognizable 24-hour time and was excluded from the hours calculation.",
        field: "breaks",
      });
      continue;
    }
    if (bEnd <= bStart || bStart < startMin || bEnd > endMin) {
      issues.push({
        code: ISSUE_CODES.SHIFT_NEGATIVE_DURATION,
        severity: "warning",
        message: `Break ${brk.break_start}-${brk.break_end} falls outside the shift or has a non-positive duration and was excluded from the hours calculation.`,
        field: "breaks",
      });
      continue;
    }
    breakMinutes += bEnd - bStart;
  }

  const netMinutes = endMin - startMin - breakMinutes;
  return { hours: Math.round((netMinutes / 60) * 100) / 100, issues };
}

export type RseValidationConfig = { maxShiftHours: number; hoursRoundingToleranceMinutes: number };

export function validateRseTimesheet(
  record: RseTimesheetRecord,
  config: RseValidationConfig,
): { issues: Issue[]; totalHoursComputed: number | null } {
  const issues: Issue[] = [];

  if (!record.worker_id && !record.worker_name) {
    issues.push({
      code: ISSUE_CODES.MISSING_MANDATORY_FIELD,
      severity: "error",
      message: "No worker ID or worker name found on this timesheet — cannot attribute hours to anyone.",
      field: "worker_id",
      suggested_action: "Enter the worker's ID or full name from the original sheet.",
    });
  } else if (!record.worker_id) {
    // No cross-tenant worker master list is available to a PACKHOUSE org in this build
    // (worker/CrewMember records belong to the CONTRACTOR org that employs the RSE
    // crew, and KiwiFlow's tenant isolation doesn't expose them here) — so a name-only
    // match can't honestly be attempted. Always flag for manual resolution instead of
    // fabricating a match, per spec Section 2.3.2.
    issues.push({
      code: ISSUE_CODES.WORKER_UNRESOLVED,
      severity: "warning",
      message: `Only a worker name ("${record.worker_name}") was found, no worker ID — needs manual matching to a known worker.`,
      field: "worker_id",
      suggested_action: "Confirm the worker's ID and link this timesheet to them manually.",
    });
  }

  if (!record.date) {
    issues.push({
      code: ISSUE_CODES.AMBIGUOUS_DATE,
      severity: "error",
      message: "Timesheet date is missing or was ambiguous and could not be safely normalized.",
      field: "date",
      suggested_action: "Confirm the date from the original sheet.",
    });
  }

  const { hours: computed, issues: hourIssues } = computeShiftHours(record.shift_start_time, record.shift_end_time, record.breaks);
  issues.push(...hourIssues);

  if (computed !== null) {
    if (computed > config.maxShiftHours) {
      issues.push({
        code: ISSUE_CODES.SHIFT_TOO_LONG,
        severity: "warning",
        message: `Computed shift length (${computed}h) exceeds the configured maximum (${config.maxShiftHours}h) — flagged as suspect, not auto-corrected.`,
        field: "shift_end_time",
        suggested_action: "Confirm the shift start/end times are correct.",
      });
    }

    if (record.total_hours !== null) {
      const toleranceHours = config.hoursRoundingToleranceMinutes / 60;
      if (Math.abs(computed - record.total_hours) > toleranceHours) {
        issues.push({
          code: ISSUE_CODES.HOURS_MISMATCH,
          severity: "error",
          message: `Sheet shows a total of ${record.total_hours}h, but shift start/end minus breaks computes to ${computed}h (tolerance ${toleranceHours}h). Both values are kept — neither is auto-corrected.`,
          field: "total_hours",
          suggested_action: "Review the original sheet and confirm which figure is correct.",
        });
      }
    }
  }

  if (record.pay_rate === null) {
    issues.push({
      code: ISSUE_CODES.MISSING_MANDATORY_FIELD,
      severity: "warning",
      message: "No pay rate was visible on the sheet — left null rather than assumed.",
      field: "pay_rate",
    });
  }

  return { issues, totalHoursComputed: computed };
}

/**
 * bin_origin records only need internal completeness checked, not cross-referencing —
 * they're the source of truth other documents cross-reference against.
 */
export function validateBinOrigin(record: BinOriginRecord): Issue[] {
  const issues: Issue[] = [];
  if (!record.bin_id) {
    issues.push({
      code: ISSUE_CODES.MISSING_MANDATORY_FIELD,
      severity: "error",
      message: "Bin origin record has no bin ID.",
      field: "bin_id",
    });
  }
  if (!record.harvest_date) {
    issues.push({
      code: ISSUE_CODES.AMBIGUOUS_DATE,
      severity: "warning",
      message: "Harvest date is missing or was ambiguous and could not be safely normalized.",
      field: "harvest_date",
    });
  }
  return issues;
}

export function validateQualityLogFields(record: QualityLogRecord): Issue[] {
  const issues: Issue[] = [];
  if (record.bin_ids.length === 0) {
    issues.push({
      code: ISSUE_CODES.MISSING_MANDATORY_FIELD,
      severity: "error",
      message: "Quality log doesn't reference any bin IDs.",
      field: "bin_ids",
    });
  }
  if (!record.date) {
    issues.push({
      code: ISSUE_CODES.AMBIGUOUS_DATE,
      severity: "warning",
      message: "Quality log date is missing or was ambiguous.",
      field: "date",
    });
  }
  return issues;
}

/** Status assignment (spec Step 4): any error -> invalid; only warnings -> valid_with_warnings; none -> valid. */
export function assignStatus(issues: Issue[]): DocumentStatus {
  if (issues.some((i) => i.severity === "error")) return "invalid";
  if (issues.length > 0) return "valid_with_warnings";
  return "valid";
}
