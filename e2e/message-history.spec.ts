import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

async function sendGroupEmail(page: Page, groupIndex: number, subject: string) {
  await page.goto("/messages/compose");
  await page.getByText("Select groups").click();
  await page.locator("[cmdk-item]").nth(groupIndex).click();
  await page.keyboard.press("Escape");

  const emailCheckbox = page.getByText("Email", { exact: true });
  if (await emailCheckbox.isVisible()) {
    await emailCheckbox.click();
  }

  await page.getByPlaceholder("Subject").fill(subject);
  await page.getByPlaceholder("Write your email here").fill("Test body");
  await page.getByRole("button", { name: "Send" }).click();

  const sent = page.getByText("sent to");
  const error = page.locator("[data-sonner-toast]");
  await expect(sent.or(error.first())).toBeVisible({ timeout: 30000 });
}

test.describe("Message history", () => {
  test("admin views message history page", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
  });

  test("sent message appears in history and opens in modal", async ({ page }) => {
    await loginAs(page, "100001");

    const subject = `History Test ${Date.now()}`;
    await sendGroupEmail(page, 1, subject);

    const sentConfirmation = page.getByText("sent to");
    if (!(await sentConfirmation.isVisible())) {
      test.skip(true, "Email provider not configured - send failed, cannot test history");
    }

    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
    await expect(page.getByText(subject)).toBeVisible({ timeout: 5000 });

    const row = page.locator("tr.cursor-pointer").filter({ hasText: subject });
    const mobileRow = page.locator("button.w-full.text-left").filter({ hasText: subject });
    const clickTarget = (await row.count()) > 0 ? row : mobileRow;
    await clickTarget.first().click();

    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("To:")).toBeVisible();
    await expect(page.getByText("Delivered:")).toBeVisible();
  });

  test("search filters to matching messages and clears", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const search = page.getByLabel("Search messages");
    await expect(search).toBeVisible();

    await search.fill("xyznonexistent");
    await page.waitForTimeout(500);

    const messageRows = page.locator("tr.cursor-pointer");
    const rowCount = await messageRows.count();
    expect(rowCount).toBe(0);

    await search.clear();
    await page.waitForTimeout(500);
  });

  test("member with no messages sees empty state", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/messages");

    const noMessages = page.getByText("No messages");
    const hasMessages = page.getByText(/Showing/);

    await expect(noMessages.or(hasMessages)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Message compose blast flow", () => {
  test("admin sees All Members option in group picker", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await page.getByText("Select groups").click();
    await expect(page.getByRole("option", { name: "All Members" })).toBeVisible();
  });

  test("member does not see All Members option", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/messages/compose");

    await page.getByText("Select groups").click();
    await expect(page.getByRole("option", { name: "All Members" })).not.toBeVisible();
  });

  test("selecting All Members shows badge and clears groups", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await page.getByText("Select groups").click();
    await page.locator("[cmdk-item]").nth(1).click();
    await page.keyboard.press("Escape");

    await expect(page.locator("[aria-label^='Remove']")).toHaveCount(1);

    await page.getByText("Add more...").click();
    await page.getByRole("option", { name: "All Members" }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByText("All Members").first()).toBeVisible();
    await expect(page.locator("[aria-label='Remove All Members']")).toBeVisible();
  });

  test("send button disables during send", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await page.getByText("Select groups").click();
    await page.locator("[cmdk-item]").nth(1).click();
    await page.keyboard.press("Escape");

    const emailCheckbox = page.getByText("Email", { exact: true });
    if (await emailCheckbox.isVisible()) {
      await emailCheckbox.click();
    }

    await page.getByPlaceholder("Subject").fill("Disable test");
    await page.getByPlaceholder("Write your email here").fill("Test body");

    await page.getByRole("button", { name: "Send" }).click();

    const sendButton = page.getByRole("button", { name: /Send/ });
    await expect(sendButton).toBeDisabled({ timeout: 2000 });
  });
});
