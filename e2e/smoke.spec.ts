import { expect, test } from "@playwright/test";

test("home abre", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Afiado/);
});
