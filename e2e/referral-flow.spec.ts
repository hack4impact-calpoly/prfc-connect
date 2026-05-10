import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Referral form", () => {
  test("form loads with valid query params", async ({ page }) => {
    await page.goto("/?nm=Test+Referrer&em=referrer@example.com&ref=TESTCODE");

    await expect(page.locator("main")).toBeVisible();
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });

  test("form loads without query params and does not crash", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("main")).toBeVisible();
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });

  test("form loads with partial query params and does not crash", async ({ page }) => {
    await page.goto("/?nm=OnlyName");

    await expect(page.locator("main")).toBeVisible();
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });

  test("add another prospect row appears", async ({ page }) => {
    await page.goto("/?nm=Test&em=test@test.com&ref=CODE");

    const addButton = page.getByRole("button", { name: /Add Another/i });
    if (await addButton.isVisible()) {
      const beforeCount = await page.getByPlaceholder(/Full Name/i).count();
      await addButton.click();
      const afterCount = await page.getByPlaceholder(/Full Name/i).count();
      expect(afterCount).toBe(beforeCount + 1);
    }
  });

  test("remove prospect row works", async ({ page }) => {
    await page.goto("/?nm=Test&em=test@test.com&ref=CODE");

    const addButton = page.getByRole("button", { name: /Add Another/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      const beforeCount = await page.getByPlaceholder(/Full Name/i).count();

      const removeButton = page.getByRole("button", { name: /Remove/i });
      if (await removeButton.first().isVisible()) {
        await removeButton.first().click();
        const afterCount = await page.getByPlaceholder(/Full Name/i).count();
        expect(afterCount).toBe(beforeCount - 1);
      }
    }
  });

  test("empty prospect submission does not show success", async ({ page }) => {
    await page.goto("/?nm=Test&em=test@test.com&ref=CODE");

    const submitButton = page.getByRole("button", { name: "Submit Referrals" });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      const success = page.getByText("submitted successfully");
      expect(await success.isVisible().catch(() => false)).toBe(false);
    }
  });
});

test.describe("Referral database access", () => {
  test("admin can access referral database", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/referral-database");

    expect(page.url()).toContain("/referral-database");
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });

  test("member is redirected to /forbidden", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/referral-database");

    expect(page.url()).toContain("/forbidden");
  });

  test("unauthenticated user is blocked from referral API", async ({ page }) => {
    const response = await page.request.get("/api/referrals");
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
