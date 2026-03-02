import { test, expect } from "@playwright/test";

test.describe("Home dashboard - member", () => {
  test("shows greeting with member name", async ({ page }) => {
    await page.goto("/home");

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("America Rempel");
  });

  test("shows My Groups heading for member", async ({ page }) => {
    await page.goto("/home");

    await expect(page.getByRole("heading", { level: 2, name: "My Groups" })).toBeVisible();
  });

  test("shows empty state or member-specific groups", async ({ page }) => {
    await page.goto("/home");

    const cards = page.locator("div").filter({ hasText: /\d+ members?/ });
    const cardCount = await cards.count();

    if (cardCount === 0) {
      await expect(page.getByText("No groups yet.")).toBeVisible();
    } else {
      await expect(cards.first()).toBeVisible();
    }
  });
});
