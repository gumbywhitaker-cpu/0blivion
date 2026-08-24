import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers";

// Signs up a fresh PACKHOUSE org (same pattern as export-shipment.spec.ts) and drives
// the Modular AI Data Bridge / God Mode UI end to end: config save, ingest, exception
// queue, and manual issue resolution. Runs against a deployment with no
// ANTHROPIC_API_KEY configured (this sandbox has none), so it exercises the "fails
// closed with a clear reason" path rather than a live model call — see
// lib/modularPipe/classify.ts. A live-classification accuracy suite is a separate,
// documented gap (lib/modularPipe/goldset/runGoldSet.ts's header comment).
test("packhouse can configure the Data Bridge, ingest a document, and resolve an issue", async ({ page }) => {
  const email = uniqueEmail("databridge");

  await page.goto("/signup");
  await page.selectOption("#orgType", "PACKHOUSE");
  await page.fill("#orgName", "CI Data Bridge Packhouse");
  await page.fill("#name", "CI Test User");
  await page.fill("#email", email);
  await page.fill("#password", "test-password-123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10_000 });

  await page.goto("/packhouse/modular-pipe");
  await expect(page.locator("h1")).toHaveText("Data Bridge — God Mode");
  await expect(page.getByText("Documents processed")).toBeVisible();

  // God Mode config: change a threshold and save.
  await page.fill('input[name="hoursRoundingToleranceMinutes"]', "10");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible();

  // Ingest a document with no ANTHROPIC_API_KEY configured — must fail closed with a
  // clear reason, never silently succeed with fabricated data.
  await page.goto("/packhouse/modular-pipe/ingest");
  await page.fill(
    'textarea[name="text"]',
    "Quality log 20/08/2026, block A4, bins BIN-001 BIN-002, variety Hayward, grade A1, inspector J. Smith",
  );
  await page.getByRole("button", { name: "Ingest document" }).click();
  await expect(page.getByText("invalid", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/isn't configured on this deployment yet/)).toBeVisible();

  // The exception queue shows the invalid document.
  await page.goto("/packhouse/modular-pipe/queue");
  await expect(page.getByText("(pasted text)")).toBeVisible();

  await page.getByText("(pasted text)").click();
  await page.waitForURL(/\/packhouse\/modular-pipe\/documents\/[a-z0-9]+/, { timeout: 10_000 });
  await expect(page.getByText(/Quality log 20\/08\/2026/)).toBeVisible();
  await expect(page.getByText("extraction_failed")).toBeVisible();

  // Manual resolution (spec Section 4.3): add a note and mark it resolved.
  await page.fill('input[name="note"]', "Retried manually after enabling the API key.");
  await page.getByRole("button", { name: "Mark resolved" }).click();
  await expect(page.getByText("resolved", { exact: true })).toBeVisible();
  await expect(page.getByText("Note: Retried manually after enabling the API key.")).toBeVisible();
});
