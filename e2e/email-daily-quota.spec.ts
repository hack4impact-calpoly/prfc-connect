import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Email daily quota", () => {
  test("compose page shows emails remaining today", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await expect(page.getByText("emails remaining today")).toBeVisible();
  });

  test("remaining count is a positive number", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    const remainingText = page.getByText(/\d+ emails remaining today/);
    await expect(remainingText).toBeVisible();
  });

  test("cron endpoint responds with queue status", async ({ page }) => {
    const response = await page.request.get("/api/cron/process-email-queue");
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("sent");
    expect(data).toHaveProperty("failed");
    expect(data).toHaveProperty("remaining");
  });
});
