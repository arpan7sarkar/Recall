import { expect, test } from "@playwright/test";

test("landing page renders its primary call to action", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
});
