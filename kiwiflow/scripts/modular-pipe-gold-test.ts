// Zero Defect Testing Suite CLI (spec Section 5) — runs the deterministic gold set +
// stress cases and applies the promotion gate (Section 5.3). Exits non-zero when the
// pack is not promotable, so this can gate CI the same way `npm run lint`/`tsc` do.
//
// Usage: npx tsx scripts/modular-pipe-gold-test.ts

import { runGoldSet } from "../lib/modularPipe/goldset/runGoldSet";

function main() {
  const run = runGoldSet();

  console.log(`Modular Pipe gold set: ${run.results.length} cases\n`);
  for (const r of run.results) {
    const marker = r.result === "pass" ? "PASS" : r.result === "soft_fail" ? "SOFT FAIL" : "HARD FAIL";
    console.log(`[${marker}] ${r.id} (${r.category}${r.criticalPayroll ? ", critical payroll" : ""})`);
    console.log(`  ${r.description}`);
    if (r.result !== "pass") {
      console.log(`  expected: ${r.expected}  actual: ${r.actual}${r.error ? `  error: ${r.error}` : ""}`);
    }
  }

  console.log(
    `\n${run.passCount} pass, ${run.softFailCount} soft fail, ${run.hardFailCount} hard fail (${(run.hardFailRate * 100).toFixed(1)}% hard-fail rate)`,
  );

  if (run.promotable) {
    console.log("\nPROMOTABLE: this configuration may be promoted to active.");
    process.exit(0);
  } else {
    console.log("\nNOT PROMOTABLE:");
    for (const reason of run.promotionBlockedReasons) console.log(`  - ${reason}`);
    process.exit(1);
  }
}

main();
