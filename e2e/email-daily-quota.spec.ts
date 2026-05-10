import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Email daily quota - admin view", () => {
  test("admin sees exact remaining count on compose page", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    const remainingText = page.getByText(/\d+ emails remaining today/);
    await expect(remainingText).toBeVisible();
  });

  test("admin remaining count is a positive number", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    const remainingText = page.getByText(/\d+ emails remaining today/);
    await expect(remainingText).toBeVisible();
    const text = await remainingText.textContent();
    const num = parseInt(text!.match(/\d+/)![0], 10);
    expect(num).toBeGreaterThan(0);
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

test.describe("Email daily quota - member view", () => {
  test("member does not see exact remaining count when quota is healthy", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/messages/compose");

    await expect(page.getByText("New Message")).toBeVisible();

    const exactCount = page.getByText(/\d+ emails remaining today/);
    expect(await exactCount.isVisible().catch(() => false)).toBe(false);
  });

  test("member does not see raw number near Send button", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/messages/compose");

    const sendArea = page.getByRole("button", { name: "Send" }).locator("..");
    const countText = sendArea.getByText(/\d+ emails/);
    expect(await countText.isVisible().catch(() => false)).toBe(false);
  });
});
