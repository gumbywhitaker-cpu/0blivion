// Gold set + stress test fixtures (spec Section 5.1) for the Zero Defect Testing
// Suite. Deliberately scoped to lib/modularPipe/validate.ts's pure, deterministic
// functions only — no live Anthropic call and no database. This is the part of the
// pipeline the "never invent totals / no guessing on business-critical data" contract
// actually binds, so it's the part that can be verified on every commit without a live
// model call or seeded data (see runGoldSet.ts's header comment for the full scope
// note, including what this suite does NOT cover).

import { computeShiftHours, validateBinOrigin, validateQualityLogFields, validateRseTimesheet } from "../validate";
import type { BinOriginRecord, DocumentStatus, QualityLogRecord, RseTimesheetRecord } from "../types";
import { assignStatus } from "../validate";

const DEFAULT_CONFIG = { maxShiftHours: 16, hoursRoundingToleranceMinutes: 6 };

function emptyRseRecord(overrides: Partial<RseTimesheetRecord>): RseTimesheetRecord {
  return {
    timesheet_id: null,
    worker_id: null,
    worker_name: null,
    worker_name_normalized: null,
    date: "2026-08-20",
    shift_start_time: null,
    shift_end_time: null,
    breaks: [],
    tasks: [],
    total_hours: null,
    overtime_hours: null,
    pay_rate: null,
    supervisor_id: null,
    approvals: [],
    ...overrides,
  };
}

function emptyQualityLogRecord(overrides: Partial<QualityLogRecord>): QualityLogRecord {
  return {
    quality_log_id: null,
    date: "2026-08-20",
    time: null,
    block_id: null,
    bin_ids: [],
    variety: null,
    grade: null,
    defects: [],
    inspector_id: null,
    comments: null,
    linked_load_id: null,
    ...overrides,
  };
}

function emptyBinOriginRecord(overrides: Partial<BinOriginRecord>): BinOriginRecord {
  return {
    bin_id: null,
    harvest_date: "2026-08-19",
    orchard_id: null,
    block_id: null,
    variety: null,
    picker_group_id: null,
    picker_ids: [],
    load_id: null,
    destination_site_id: null,
    special_handling_flags: [],
    ...overrides,
  };
}

export type GoldCase = {
  id: string;
  description: string;
  category: "gold" | "stress";
  /** Per spec Section 5.3: any critical payroll calculation test failing blocks
   * promotion regardless of the overall hard-fail rate. */
  criticalPayroll?: boolean;
  expectedStatus: DocumentStatus;
  run: () => DocumentStatus;
};

export const GOLD_CASES: GoldCase[] = [
  {
    id: "rse-normal-shift-matches-reported",
    description: "8h shift, 30min break, reported total matches computed total exactly",
    category: "gold",
    criticalPayroll: true,
    expectedStatus: "valid",
    run: () => {
      const record = emptyRseRecord({
        worker_id: "W-101",
        shift_start_time: "07:00",
        shift_end_time: "15:30",
        breaks: [{ break_start: "11:00", break_end: "11:30" }],
        total_hours: 8,
        pay_rate: 24.5,
      });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      return assignStatus(issues);
    },
  },
  {
    id: "rse-hours-mismatch-blocks-payroll",
    description: "Sheet shows 9h but shift math computes 8h — must never be auto-corrected, must be invalid",
    category: "gold",
    criticalPayroll: true,
    expectedStatus: "invalid",
    run: () => {
      const record = emptyRseRecord({
        worker_id: "W-102",
        shift_start_time: "07:00",
        shift_end_time: "15:30",
        breaks: [{ break_start: "11:00", break_end: "11:30" }],
        total_hours: 9,
      });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      return assignStatus(issues);
    },
  },
  {
    id: "rse-within-rounding-tolerance",
    description: "Reported total off by 5 minutes (within the 6-minute default tolerance) stays valid",
    category: "gold",
    expectedStatus: "valid",
    run: () => {
      const record = emptyRseRecord({
        worker_id: "W-103",
        shift_start_time: "07:00",
        shift_end_time: "15:00",
        breaks: [],
        total_hours: 8.08, // 8h + 5min
        pay_rate: 24.5,
      });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      return assignStatus(issues);
    },
  },
  {
    id: "rse-end-before-start-rejected",
    description: "Shift end time before start time is rejected outright, never silently reinterpreted as overnight",
    category: "gold",
    criticalPayroll: true,
    expectedStatus: "invalid",
    run: () => {
      const record = emptyRseRecord({ worker_id: "W-104", shift_start_time: "19:00", shift_end_time: "07:00" });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      return assignStatus(issues);
    },
  },
  {
    id: "rse-suspiciously-long-shift-flagged",
    description: "20h computed shift (over the configured 16h max) is flagged as suspect, not silently accepted",
    category: "gold",
    expectedStatus: "valid_with_warnings",
    run: () => {
      const record = emptyRseRecord({
        worker_id: "W-105",
        shift_start_time: "05:00",
        shift_end_time: "23:00",
        total_hours: 18,
      });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      return assignStatus(issues);
    },
  },
  {
    id: "rse-missing-worker-identity-blocks-payroll",
    description: "No worker ID and no worker name at all — cannot attribute hours to anyone, must be invalid",
    category: "gold",
    criticalPayroll: true,
    expectedStatus: "invalid",
    run: () => {
      const record = emptyRseRecord({ shift_start_time: "07:00", shift_end_time: "15:00" });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      return assignStatus(issues);
    },
  },
  {
    id: "rse-name-only-flagged-not-guessed",
    description: "Worker name present but no ID — flagged for manual resolution, never auto-matched",
    category: "gold",
    expectedStatus: "valid_with_warnings",
    run: () => {
      const record = emptyRseRecord({
        worker_name: "T. Nguyen",
        shift_start_time: "07:00",
        shift_end_time: "15:00",
        total_hours: 8,
        pay_rate: 24.5,
      });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      return assignStatus(issues);
    },
  },
  {
    id: "rse-missing-pay-rate-never-fabricated",
    description: "No pay rate visible on the sheet — must stay null and only warn, never be invented",
    category: "gold",
    criticalPayroll: true,
    expectedStatus: "valid_with_warnings",
    run: () => {
      const record = emptyRseRecord({ worker_id: "W-106", shift_start_time: "07:00", shift_end_time: "15:00", total_hours: 8 });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      if (record.pay_rate !== null) throw new Error("pay_rate must remain null when not visible on the source document");
      return assignStatus(issues);
    },
  },
  {
    id: "stress-smudged-break-times-excluded-not-guessed",
    description: "Illegible break times (smudged scan) are excluded from the hours calculation, not guessed at",
    category: "stress",
    expectedStatus: "valid_with_warnings",
    run: () => {
      const { hours, issues } = computeShiftHours("07:00", "15:00", [{ break_start: "??:??", break_end: "??:??" }]);
      if (hours !== 8) throw new Error(`expected illegible break to be excluded, computed ${hours}h`);
      const record = emptyRseRecord({
        worker_id: "W-107",
        shift_start_time: "07:00",
        shift_end_time: "15:00",
        breaks: [{ break_start: "??:??", break_end: "??:??" }],
        total_hours: 8,
        pay_rate: 24.5,
      });
      const { issues: rseIssues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      void issues;
      return assignStatus(rseIssues);
    },
  },
  {
    id: "stress-ambiguous-date-never-guessed",
    description: "Handwritten date with no unambiguous format is left null with an error, never format-guessed",
    category: "stress",
    expectedStatus: "invalid",
    run: () => {
      const record = emptyRseRecord({ worker_id: "W-108", date: null, shift_start_time: "07:00", shift_end_time: "15:00", total_hours: 8 });
      const { issues } = validateRseTimesheet(record, DEFAULT_CONFIG);
      return assignStatus(issues);
    },
  },
  {
    id: "quality-log-missing-bin-ids-invalid",
    description: "Quality log with no bin IDs at all is invalid — nothing to cross-reference",
    category: "gold",
    expectedStatus: "invalid",
    run: () => assignStatus(validateQualityLogFields(emptyQualityLogRecord({ bin_ids: [] }))),
  },
  {
    id: "quality-log-complete-record-valid",
    description: "Quality log with bin IDs and date present passes with no issues",
    category: "gold",
    expectedStatus: "valid",
    run: () => assignStatus(validateQualityLogFields(emptyQualityLogRecord({ bin_ids: ["BIN-001"] }))),
  },
  {
    id: "bin-origin-missing-bin-id-invalid",
    description: "Bin origin record with no bin ID is invalid",
    category: "gold",
    expectedStatus: "invalid",
    run: () => assignStatus(validateBinOrigin(emptyBinOriginRecord({ bin_id: null }))),
  },
  {
    id: "bin-origin-complete-record-valid",
    description: "Bin origin record with bin ID and harvest date passes with no issues",
    category: "gold",
    expectedStatus: "valid",
    run: () => assignStatus(validateBinOrigin(emptyBinOriginRecord({ bin_id: "BIN-001" }))),
  },
];
