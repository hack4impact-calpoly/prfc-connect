import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Notification badge and dropdown", () => {
  test("bell icon is visible in header", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    const bell = page.locator("button").filter({ has: page.locator("svg.lucide-bell") });
    await expect(bell.first()).toBeVisible();
  });

  test("clicking bell opens notification dropdown", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    const bell = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-bell") })
      .first();
    await bell.click();

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await expect(popover).toBeVisible({ timeout: 5000 });
  });

  test("notification dropdown closes on escape", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    const bell = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-bell") })
      .first();
    await bell.click();

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await expect(popover).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await expect(popover).not.toBeVisible();
  });

  test("badge clears after opening dropdown", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    const bell = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-bell") })
      .first();
    const badge = bell.locator("span.absolute");
    const hadBadge = await badge.isVisible().catch(() => false);

    await bell.click();
    await page.waitForTimeout(1000);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    if (hadBadge) {
      const stillHasBadge = await badge.isVisible().catch(() => false);
      expect(stillHasBadge).toBe(false);
    }
  });

  test("unauthenticated user cannot reach notification data", async ({ page }) => {
    await page.goto("/home");
    expect(page.url()).toContain("/unauthorized");
  });
});
