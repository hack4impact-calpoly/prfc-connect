import { test, expect } from "@playwright/test";

test.describe("Home dashboard - admin", () => {
  test("shows greeting with admin name", async ({ page }) => {
    await page.goto("/home");

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Toby Deckow");
  });

  test("greeting starts with time-of-day prefix", async ({ page }) => {
    await page.goto("/home");

    const heading = page.getByRole("heading", { level: 1 });
    const text = await heading.textContent();
    expect(text).toMatch(/^Good (Morning|Afternoon|Evening)/);
  });

  test("shows All Groups heading for admin", async ({ page }) => {
    await page.goto("/home");

    await expect(page.getByRole("heading", { level: 2, name: "All Groups" })).toBeVisible();
  });

  test("displays group cards or empty state", async ({ page }) => {
    await page.goto("/home");

    const cards = page.locator("div").filter({ hasText: /\d+ members?/ });
    const cardCount = await cards.count();

    if (cardCount === 0) {
      await expect(page.getByText("No groups yet.")).toBeVisible();
    } else {
      await expect(cards.first()).toBeVisible();
    }
  });

  test("group cards are not interactive on dashboard", async ({ page }) => {
    await page.goto("/home");

    const cards = page.locator("div").filter({ hasText: /\d+ members?/ });
    const cardCount = await cards.count();
    test.skip(cardCount === 0, "no groups to test with");

    const buttons = page.locator("button").filter({ hasText: /\d+ members?/ });
    await expect(buttons).toHaveCount(0);
  });

  test("shows sidebar and top bar layout", async ({ page }) => {
    await page.goto("/home");

    await expect(page.getByLabel("Go to home")).toBeVisible();
    await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
    await expect(page.getByLabel("User menu")).toBeVisible();
  });
});
