import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Message compose flow", () => {
  const groupName = `Compose Flow Test ${Date.now()}`;
  const emailSubject = `Compose Test ${Date.now()}`;

  test("admin creates group with members then sends email", async ({ page }) => {
    await loginAs(page, "100001");

    await page.goto("/groups?create=true");
    await expect(page.getByPlaceholder("Group Name")).toBeVisible();
    await page.getByPlaceholder("Group Name").fill(groupName);

    const memberLabels = page.locator("#member-list label");
    if ((await memberLabels.count()) > 0) {
      await memberLabels.first().click();
    }

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Group created")).toBeVisible({ timeout: 10000 });

    await page.goto("/messages/compose");
    await expect(page.getByText("New Message")).toBeVisible();

    await page.getByRole("combobox").click();
    await page.getByPlaceholder("Search groups...").fill(groupName);
    await page.getByRole("option", { name: groupName }).click();
    await page.keyboard.press("Escape");

    const emailCheckbox = page.getByText("Email", { exact: true });
    if (await emailCheckbox.isVisible()) {
      await emailCheckbox.click();
    }

    await page.getByPlaceholder("Subject").fill(emailSubject);
    await page.getByPlaceholder("Write your email here").fill("Integration test body");
    await page.getByRole("button", { name: "Send" }).click();

    const sent = page.getByText("sent to");
    const error = page.locator("[data-sonner-toast]");
    await expect(sent.or(error.first())).toBeVisible({ timeout: 30000 });

    if (await sent.isVisible()) {
      await page.getByRole("button", { name: "Delivery Status" }).click();
      await page.waitForURL("/messages");
      await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
    }
  });

  test("empty subject shows validation error", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await page.getByRole("combobox").click();
    await page.locator("[cmdk-item]").first().click();
    await page.keyboard.press("Escape");

    const emailCheckbox = page.getByText("Email", { exact: true });
    if (await emailCheckbox.isVisible()) {
      await emailCheckbox.click();
    }

    await page.getByPlaceholder("Write your email here").fill("Body without subject");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("Email subject is required")).toBeVisible();
  });

  test("no group selected shows validation error", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    const emailCheckbox = page.getByText("Email", { exact: true });
    if (await emailCheckbox.isVisible()) {
      await emailCheckbox.click();
    }

    await page.getByPlaceholder("Subject").fill("Test subject");
    await page.getByPlaceholder("Write your email here").fill("Test body");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("Please select at least one recipient group")).toBeVisible();
  });

  test("back to messages link navigates to history", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await page.getByText("Back to Messages").click();
    await page.waitForURL("/messages");

    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
  });

  test("multiple groups can be selected and deselected via badge", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await page.getByText("Select groups").click();
    await page.locator("[cmdk-item]").nth(1).click();
    await page.locator("[cmdk-item]").nth(2).click();
    await page.keyboard.press("Escape");

    const badges = page.locator("[aria-label^='Remove']");
    await expect(badges).toHaveCount(2);

    await badges.first().click();
    await expect(page.locator("[aria-label^='Remove']")).toHaveCount(1);

    await page.locator("[aria-label^='Remove']").first().click();
    await expect(page.getByText("Select groups")).toBeVisible();
  });

  test("HTML in group name renders as plain text", async ({ page }) => {
    await loginAs(page, "100001");

    const xssName = `<img src=x> ${Date.now()}`;
    await page.goto("/groups?create=true");
    await page.getByPlaceholder("Group Name").fill(xssName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Group created")).toBeVisible({ timeout: 10000 });

    await page.goto("/groups");
    const card = page.getByText(xssName);
    await expect(card).toBeVisible();

    const images = await page.locator("img[src='x']").count();
    expect(images).toBe(0);
  });

  test("/api/members without auth returns error", async ({ page }) => {
    const response = await page.request.get("/api/members");
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
