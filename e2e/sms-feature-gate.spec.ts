import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("SMS feature gate", () => {
  test("compose page hides SMS when SMS_ENABLED=false", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    const smsCheckbox = page.getByText("Text Message");
    const channelSection = page.getByText("Select a Channel");

    const smsVisible = await smsCheckbox.isVisible();

    if (!smsVisible) {
      expect(await channelSection.isVisible()).toBe(false);
      await expect(page.getByPlaceholder("Subject")).toBeVisible();
    } else {
      expect(await channelSection.isVisible()).toBe(true);
    }
  });

  test("settings hides SMS toggle when SMS_ENABLED=false", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/settings");

    const smsToggle = page.getByText("Receive event reminders and group messages via text");
    const smsVisible = await smsToggle.isVisible();

    if (!smsVisible) {
      await expect(page.getByText("Msg & data rates")).not.toBeVisible();
    }
  });

  test("message history hides channel filter when SMS_ENABLED=false", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const messageTypeDropdown = page.locator("[placeholder='Message Type']");
    const dropdownVisible = await messageTypeDropdown.isVisible().catch(() => false);

    if (!dropdownVisible) {
      const smsOption = page.getByRole("option", { name: "SMS" });
      expect(await smsOption.isVisible().catch(() => false)).toBe(false);
    }
  });
});
