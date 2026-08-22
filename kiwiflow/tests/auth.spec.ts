import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

// Uses the seeded demo accounts (prisma/seed.ts) — run `npm run db:seed`
// against a fresh DATABASE_URL before this test, same as CI does.
const GROWER = { email: "hana@whakatane-orchards.example", password: "kiwiflow123" };
const CONTRACTOR = { email: "wiremu@southernharvest.example", password: "kiwiflow123" };

test("grower can log in and sees the grower nav", async ({ page }) => {
  await loginAs(page, GROWER.email, GROWER.password);
  await expect(page.locator("nav")).toContainText("Command Center");
});

test("contractor can log in and sees the contractor nav", async ({ page }) => {
  await loginAs(page, CONTRACTOR.email, CONTRACTOR.password);
  await expect(page.locator("nav")).toContainText("Contractor Hub");
});

test("wrong password is rejected with an error, not a silent redirect", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', GROWER.email);
  await page.fill('input[name="password"]', "definitely-not-the-password");
  await page.click('button[type="submit"]');
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/login/);
});
