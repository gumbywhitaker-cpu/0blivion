import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

const GROWER = { email: "hana@whakatane-orchards.example", password: "kiwiflow123" };

test("grower sees the daily briefing page and it fails closed without an AI key", async ({ page }) => {
  await loginAs(page, GROWER.email, GROWER.password);
  await page.goto("/briefing");
  await expect(page.locator("h1")).toHaveText("Daily Briefing");
  // No ANTHROPIC_API_KEY in CI/test envs — must show the fail-closed message,
  // not a crash or a fabricated briefing.
  await expect(page.getByText(/isn.t configured on this deployment yet/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /generate briefing|regenerate briefing/i })).toBeVisible();
});
