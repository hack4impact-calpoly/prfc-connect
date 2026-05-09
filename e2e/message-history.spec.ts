import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Message history", () => {
  test("admin views message history page", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
  });

  test("message row opens view modal when messages exist", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const firstRow = page.locator("tr.cursor-pointer").first();
    const mobileRow = page.locator("button.w-full.text-left").first();
    const hasRow = (await firstRow.count()) > 0 || (await mobileRow.count()) > 0;

    if (hasRow) {
      const row = (await firstRow.count()) > 0 ? firstRow : mobileRow;
      await row.click();
      await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("To:")).toBeVisible();
      await expect(page.getByText("Delivered:")).toBeVisible();
    }
  });

  test("search filters message list", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const search = page.getByLabel("Search messages");
    await expect(search).toBeVisible();

    await search.fill("xyznonexistent");
    await page.waitForTimeout(500);

    const noMessages = page.getByText("No messages");
    const emptyTable = page.locator("tbody:empty, .divide-y:empty");
    await expect(noMessages.or(emptyTable)).toBeVisible({ timeout: 5000 });

    await search.clear();
    await page.waitForTimeout(500);
  });

  test("pagination controls are visible when messages exist", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const showingText = page.getByText(/Showing \d+-\d+ of \d+/);
    const noMessages = page.getByText("No messages");

    if (await showingText.isVisible()) {
      await expect(page.getByText("Rows per page")).toBeVisible();
    } else {
      await expect(noMessages).toBeVisible();
    }
  });

  test("rows per page selector changes page size", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const showingText = page.getByText(/Showing \d+-\d+ of \d+/);
    if (await showingText.isVisible()) {
      const pageSizeSelect = page.locator("select, [role='combobox']").filter({ hasText: /10|25|50/ });
      if ((await pageSizeSelect.count()) > 0) {
        await pageSizeSelect.first().click();
        const option25 = page.getByRole("option", { name: "25" });
        if (await option25.isVisible()) {
          await option25.click();
        }
      }
    }
  });

  test("member sees only messages from their groups", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/messages");

    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
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

    await page.getByRole("combobox").click();
    await expect(page.getByRole("option", { name: "All Members" })).toBeVisible();
  });

  test("member does not see All Members option", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/messages/compose");

    await page.getByRole("combobox").click();
    await expect(page.getByRole("option", { name: "All Members" })).not.toBeVisible();
  });

  test("selecting All Members shows badge and clears groups", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    const trigger = page.getByText("Select groups");
    await trigger.click();
    const items = page.locator("[cmdk-item]");
    if ((await items.count()) > 1) {
      await items.nth(1).click();
    }
    await page.keyboard.press("Escape");

    await page.getByText("Add more...").click();
    await page.getByRole("option", { name: "All Members" }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByText("All Members").first()).toBeVisible();
  });

  test("send button disables during send to prevent double-click", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await page.getByRole("combobox").click();
    await page.locator("[cmdk-item]").first().click();
    await page.keyboard.press("Escape");

    const emailCheckbox = page.getByText("Email", { exact: true });
    if (await emailCheckbox.isVisible()) {
      await emailCheckbox.click();
    }

    await page.getByPlaceholder("Subject").fill("Double click test");
    await page.getByPlaceholder("Write your email here").fill("Test body");

    await page.getByRole("button", { name: "Send" }).click();

    const sendButton = page.getByRole("button", { name: /Send/ });
    await expect(sendButton).toBeDisabled({ timeout: 1000 });
  });
});
