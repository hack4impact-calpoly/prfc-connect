import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Compose message - admin", () => {
  test("admin can access compose page", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await expect(page.getByText("New Message")).toBeVisible();
  });

  test("compose page has group picker and channel options", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
  });

  test("send button is visible", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages/compose");

    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  });
});

test.describe("Compose message - member", () => {
  test("member can access compose page", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/messages/compose");

    await expect(page.getByText("New Message")).toBeVisible();
  });
});
