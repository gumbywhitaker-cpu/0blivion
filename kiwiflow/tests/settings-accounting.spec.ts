import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

const GROWER = { email: "hana@whakatane-orchards.example", password: "kiwiflow123" };

test("grower sees Xero and MYOB sections on settings, both unconfigured in this env", async ({ page }) => {
  await loginAs(page, GROWER.email, GROWER.password);
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Accounting" })).toBeVisible();
  await expect(page.getByText(/Xero isn.t configured on this deployment/)).toBeVisible();

  await expect(page.getByRole("heading", { name: "MYOB" })).toBeVisible();
  await expect(page.getByText(/MYOB isn.t configured on this deployment/)).toBeVisible();
});
