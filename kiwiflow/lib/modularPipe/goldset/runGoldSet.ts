// Zero Defect Testing Suite — test harness behavior + promotion gate (spec Sections
// 5.2/5.3), run against the deterministic gold set + stress cases in cases.ts.
//
// Honest scope note: this harness verifies lib/modularPipe/validate.ts — the
// deterministic hours/status/completeness logic that must never guess. It does NOT
// exercise classify.ts's live model call (document classification/field extraction
// accuracy), because that requires a configured ANTHROPIC_API_KEY and network access
// and isn't something a promotion gate can require on every commit/CI run. A live
// extraction-accuracy suite against real messy documents is real future work, not
// invented here — see the CLI script (scripts/modular-pipe-gold-test.ts) for how to
// run this one.

import { GOLD_CASES, type GoldCase } from "./cases";

export type CaseResult = {
  id: string;
  description: string;
  category: GoldCase["category"];
  criticalPayroll: boolean;
  result: "pass" | "soft_fail" | "hard_fail";
  expected: string;
  actual: string;
  error?: string;
};

export type GoldSetRun = {
  results: CaseResult[];
  hardFailCount: number;
  softFailCount: number;
  passCount: number;
  hardFailRate: number; // 0-1
  criticalPayrollFailure: boolean;
  promotable: boolean;
  promotionBlockedReasons: string[];
};

const HARD_FAIL_RATE_THRESHOLD = 0.05; // 5% — spec Section 5.3's "X%" left as a configurable default

export function runGoldSet(): GoldSetRun {
  const results: CaseResult[] = GOLD_CASES.map((testCase) => {
    try {
      const actual = testCase.run();
      const pass = actual === testCase.expectedStatus;
      return {
        id: testCase.id,
        description: testCase.description,
        category: testCase.category,
        criticalPayroll: testCase.criticalPayroll ?? false,
        result: pass ? "pass" : "hard_fail",
        expected: testCase.expectedStatus,
        actual,
      };
    } catch (err) {
      return {
        id: testCase.id,
        description: testCase.description,
        category: testCase.category,
        criticalPayroll: testCase.criticalPayroll ?? false,
        result: "hard_fail",
        expected: testCase.expectedStatus,
        actual: "(threw)",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const hardFailCount = results.filter((r) => r.result === "hard_fail").length;
  const softFailCount = results.filter((r) => r.result === "soft_fail").length;
  const passCount = results.filter((r) => r.result === "pass").length;
  const hardFailRate = results.length > 0 ? hardFailCount / results.length : 0;
  const criticalPayrollFailure = results.some((r) => r.criticalPayroll && r.result !== "pass");

  const promotionBlockedReasons: string[] = [];
  if (hardFailRate > HARD_FAIL_RATE_THRESHOLD) {
    promotionBlockedReasons.push(
      `Hard-fail rate ${(hardFailRate * 100).toFixed(1)}% exceeds the ${(HARD_FAIL_RATE_THRESHOLD * 100).toFixed(0)}% threshold.`,
    );
  }
  if (criticalPayrollFailure) {
    promotionBlockedReasons.push("A critical payroll calculation test failed.");
  }

  return {
    results,
    hardFailCount,
    softFailCount,
    passCount,
    hardFailRate,
    criticalPayrollFailure,
    promotable: promotionBlockedReasons.length === 0,
    promotionBlockedReasons,
  };
}
