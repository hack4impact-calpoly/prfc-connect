import { test, expect, type Page } from "@playwright/test";

async function openUserMenu(page: Page) {
  await page.getByLabel("User menu").click();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
}

test.describe("User menu dropdown", () => {
  test("opens dropdown showing Profile, Account Settings, and Sign out", async ({ page }) => {
    await page.goto("/home");

    await openUserMenu(page);

    await expect(page.getByRole("menuitem", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Account Settings" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  });

  test("displays user name and role in trigger", async ({ page }) => {
    await page.goto("/home");

    const trigger = page.locator("#user-menu-trigger");
    const text = await trigger.textContent();

    // Admin: "Toby Deckow" + "Admin Manager"
    // Member: "America Rempel" + "Member"
    expect(text).toMatch(/Toby Deckow|America Rempel/);
    expect(text).toMatch(/Admin Manager|Member/);
  });

  test("Profile navigates to /settings", async ({ page }) => {
    await page.goto("/home");

    await openUserMenu(page);
    await page.getByRole("menuitem", { name: "Profile" }).click();

    await expect(page).toHaveURL("/settings");
  });

  test("Account Settings navigates to /settings", async ({ page }) => {
    await page.goto("/home");

    await openUserMenu(page);
    await page.getByRole("menuitem", { name: "Account Settings" }).click();

    await expect(page).toHaveURL("/settings");
  });

  test("closes on outside click", async ({ page }) => {
    await page.goto("/home");

    await openUserMenu(page);

    await page.locator("main").click({ force: true });
    await expect(page.getByRole("menuitem", { name: "Sign out" })).not.toBeVisible();
  });

  test("closes on Escape key", async ({ page }) => {
    await page.goto("/home");

    await openUserMenu(page);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("menuitem", { name: "Sign out" })).not.toBeVisible();
  });
});

test.describe("Logout flow", () => {
  test("Sign out redirects to the portal login", async ({ page }) => {
    await page.goto("/home");

    await openUserMenu(page);
    await page.getByRole("menuitem", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/unauthorized/);
  });

  test("protected page inaccessible after sign out", async ({ page }) => {
    await page.goto("/home");

    await openUserMenu(page);
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/unauthorized/);

    const response = await page.goto("/home");
    const url = page.url();
    const status = response?.status() ?? 0;
    const isRedirected = !url.includes("/home");
    const isErrorStatus = status >= 400;
    expect(isRedirected || isErrorStatus).toBe(true);
  });
});
