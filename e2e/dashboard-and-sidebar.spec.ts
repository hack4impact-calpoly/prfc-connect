import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Dashboard quick actions", () => {
  test("Create Event quick action opens event dialog", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    await page.getByRole("button", { name: "Create Event" }).click();
    await page.waitForURL("/events?create=true");

    await expect(page.getByPlaceholder("New Event Title")).toBeVisible();
  });

  test("Create Group quick action opens group modal", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    await page.getByRole("button", { name: "Create Group" }).click();
    await page.waitForURL("/groups?create=true");

    await expect(page.getByPlaceholder("Group Name")).toBeVisible();
  });

  test("Send Message quick action opens compose", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    await page.getByRole("button", { name: "Send Message" }).click();
    await page.waitForURL("/messages/compose");

    await expect(page.getByText("New Message")).toBeVisible();
  });

  test("member dashboard loads without error", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/home");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });

  test("quick action then browser back does not crash", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    await page.getByRole("button", { name: "Create Event" }).click();
    await page.waitForURL("/events?create=true");

    await page.goBack();
    await page.waitForTimeout(500);

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });
});

test.describe("Sidebar", () => {
  test("admin sees Referral Database in sidebar", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    await expect(page.getByRole("link", { name: "Referral Database" })).toBeVisible();
  });

  test("member does not see Referral Database in sidebar", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/home");

    await expect(page.getByRole("link", { name: "Referral Database" })).not.toBeVisible();
  });

  test("sidebar collapse toggle works", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    const hamburger = page.locator("[aria-label='Toggle sidebar']");
    await expect(hamburger).toBeVisible();

    const dashboardLink = page.getByRole("link", { name: "Dashboard", exact: true });
    await expect(dashboardLink).toBeVisible();

    await hamburger.click();
    await page.waitForTimeout(300);

    await hamburger.click();
    await page.waitForTimeout(300);

    await expect(dashboardLink).toBeVisible();
  });

  test("sidebar collapse persists across refresh", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/home");

    const hamburger = page.locator("[aria-label='Toggle sidebar']");
    await hamburger.click();
    await page.waitForTimeout(300);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await hamburger.click();
    await page.waitForTimeout(300);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  });
});
