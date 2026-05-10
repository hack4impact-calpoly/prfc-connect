import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Search XSS and injection", () => {
  test("script tag in groups search does not execute", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/groups");

    let alertFired = false;
    page.on("dialog", (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });

    const search = page.getByPlaceholder("Search");
    if (await search.isVisible()) {
      await search.fill("<script>alert('xss')</script>");
      await page.waitForTimeout(500);
      expect(alertFired).toBe(false);
    }
  });

  test("SQL injection in messages search does not crash", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const search = page.getByLabel("Search messages");
    await search.fill("'; DROP TABLE message; --");
    await page.waitForTimeout(500);

    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();

    await search.clear();
    await page.waitForTimeout(500);
    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
  });

  test("unicode and special characters in search do not crash", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const search = page.getByLabel("Search messages");
    await search.fill("测试 🔥 ñ ü ∞");
    await page.waitForTimeout(500);

    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
  });

  test("URL with script in search param does not execute XSS", async ({ page }) => {
    await loginAs(page, "100001");

    let alertFired = false;
    page.on("dialog", (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });

    await page.goto("/groups?search=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E");
    await page.waitForTimeout(500);

    expect(alertFired).toBe(false);
    await expect(page.getByRole("heading", { name: "Groups" })).toBeVisible();
  });
});
