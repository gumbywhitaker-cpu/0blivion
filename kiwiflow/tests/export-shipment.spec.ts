import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers";

// Full signup -> create shipment flow for a fresh PACKHOUSE org, rather than
// depending on seed data staying in a particular shape. Covers the create
// half of the export-shipment status machine end to end through real forms;
// the transition-through-all-statuses path needs a second (TRANSPORT) actor
// and a graded load, which is exercised manually — see task #48 notes.
test("packhouse can sign up and create a new export shipment", async ({ page }) => {
  const email = uniqueEmail("packhouse");

  await page.goto("/signup");
  await page.selectOption("#orgType", "PACKHOUSE");
  await page.fill("#orgName", "CI Test Packhouse");
  await page.fill("#name", "CI Test User");
  await page.fill("#email", email);
  await page.fill("#password", "test-password-123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10_000 });

  await page.goto("/export");
  await expect(page.locator("h1")).toHaveText("Export shipments");
  await expect(page.getByText("0 graded loads not yet on a shipment.")).toBeVisible();

  await page.getByRole("button", { name: "New shipment" }).click();
  await page.waitForURL(/\/export\/[a-z0-9]+/, { timeout: 10_000 });

  await expect(page.getByText(/CI Test Packhouse.*Transport org not set/)).toBeVisible();
  // "PREPARING" also appears in the status-history list below the badge —
  // scope to the badge specifically (first occurrence, right of the header).
  await expect(page.getByText("PREPARING", { exact: true }).first()).toBeVisible();
});
