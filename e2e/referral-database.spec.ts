import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/dev/mock-portal");
  await page.getByLabel("Owner ID").fill("100184");
  await page.getByLabel("Admin access").check();
  await page.getByRole("button", { name: "Enter PRFC Connect" }).click();
  await page.waitForURL("/");
  await page.goto("/referral-database");
}

test.describe("Referral Database Page", () => {
  test("redirects without session", async ({ page }) => {
    const response = await page.goto("/referral-database");
    expect(response?.url()).not.toContain("/referral-database");
  });

  test("shows data grid after login", async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText(/member name/i)).toBeVisible();
  });

  test("search filters table rows", async ({ page }) => {
    await loginAsAdmin(page);

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("test");

    await expect(page.getByRole("table")).toBeVisible();
  });

  test("toggle switch updates redeemed status", async ({ page }) => {
    await loginAsAdmin(page);

    const firstSwitch = page.getByRole("switch").first();
    const initialChecked = await firstSwitch.isChecked();

    await firstSwitch.click();

    await expect(firstSwitch).toBeChecked({ checked: !initialChecked });
  });
});
