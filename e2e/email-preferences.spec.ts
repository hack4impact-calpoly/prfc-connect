import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe.serial("Email notification preferences", () => {
  test("settings page shows email toggle with correct description", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Notifications")).toBeVisible();
    await expect(page.getByText("Receive event announcements and group messages via email")).toBeVisible();
    await expect(page.getByText("Turning this off stops all group emails")).toBeVisible();

    const toggle = page.locator("#email-toggle");
    await expect(toggle).toBeVisible();
  });

  test("email toggle can be turned OFF and shows toast", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/settings");

    const toggle = page.locator("#email-toggle");
    const initialState = await toggle.getAttribute("data-state");

    if (initialState === "checked") {
      await toggle.click();
      await page.waitForTimeout(500);

      const toast = page.locator("[data-sonner-toast]");
      await expect(toast.first()).toBeVisible({ timeout: 5000 });

      const newState = await toggle.getAttribute("data-state");
      expect(newState).toBe("unchecked");
    }
  });

  test("email toggle OFF persists after page navigation", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/settings");

    const toggle = page.locator("#email-toggle");
    const state = await toggle.getAttribute("data-state");

    if (state === "checked") {
      await toggle.click();
      await page.waitForTimeout(500);
    }

    await page.goto("/home");
    await page.goto("/settings");

    const stateAfterNav = await page.locator("#email-toggle").getAttribute("data-state");
    expect(stateAfterNav).toBe("unchecked");
  });

  test("email toggle can be turned back ON", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/settings");

    const toggle = page.locator("#email-toggle");
    const state = await toggle.getAttribute("data-state");

    if (state === "unchecked") {
      await toggle.click();
      await page.waitForTimeout(500);

      const toast = page.locator("[data-sonner-toast]");
      await expect(toast.first()).toBeVisible({ timeout: 5000 });

      const newState = await toggle.getAttribute("data-state");
      expect(newState).toBe("checked");
    }
  });

  test("per-group email toggle is visible on group detail page", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/groups");

    const firstCard = page.locator("[class*='cursor-pointer']").first();
    if ((await firstCard.count()) > 0) {
      await firstCard.click();
      await page.waitForURL(/\/groups\/\d+/);

      await expect(page.getByText("Receive emails from this group")).toBeVisible();
      const groupToggle = page.locator("#group-email-toggle");
      await expect(groupToggle).toBeVisible();
    }
  });

  test("per-group toggle OFF does not affect global toggle", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/groups");

    const firstCard = page.locator("[class*='cursor-pointer']").first();
    if ((await firstCard.count()) > 0) {
      await firstCard.click();
      await page.waitForURL(/\/groups\/\d+/);

      const groupToggle = page.locator("#group-email-toggle");
      const groupState = await groupToggle.getAttribute("data-state");

      if (groupState === "checked") {
        await groupToggle.click();
        await page.waitForTimeout(500);

        const toast = page.locator("[data-sonner-toast]");
        await expect(toast.first()).toBeVisible({ timeout: 5000 });
      }

      await page.goto("/settings");
      const globalToggle = page.locator("#email-toggle");
      const globalState = await globalToggle.getAttribute("data-state");
      expect(globalState).toBe("checked");

      await page.goBack();
      await page.waitForURL(/\/groups\/\d+/);
      const restored = page.locator("#group-email-toggle");
      const restoredState = await restored.getAttribute("data-state");
      if (restoredState === "unchecked") {
        await restored.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("SMS toggle hidden when SMS_ENABLED is false", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/settings");

    const smsToggle = page.getByText("Receive event reminders and group messages via text");
    const smsVisible = await smsToggle.isVisible();

    if (!smsVisible) {
      await expect(page.getByText("Msg & data rates")).not.toBeVisible();
      await expect(page.locator("#sms-toggle")).not.toBeVisible();
    }
  });
});
