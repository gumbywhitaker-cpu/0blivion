import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

const GROWER = { email: "hana@whakatane-orchards.example", password: "kiwiflow123" };

test("grower can reach the invoices page", async ({ page }) => {
  await loginAs(page, GROWER.email, GROWER.password);
  await page.goto("/invoices");
  await expect(page.locator("h1")).toHaveText("Invoices");
});

test("grower can reach the certifications audit-readiness page", async ({ page }) => {
  await loginAs(page, GROWER.email, GROWER.password);
  await page.goto("/certifications");
  await expect(page.locator("h1")).toHaveText("Certifications");
});

test("a non-packhouse/transport org is redirected away from /export", async ({ page }) => {
  await loginAs(page, GROWER.email, GROWER.password);
  await page.goto("/export");
  // /export -> redirect("/dashboard") -> DashboardRedirect's role router ->
  // /grower for a GROWER session. Assert it lands anywhere but /export.
  await page.waitForURL((url) => !url.pathname.startsWith("/export"), { timeout: 10_000 });
});
