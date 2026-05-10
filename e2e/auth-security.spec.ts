import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Auth cookie security flags", () => {
  test("auth cookie is HttpOnly", async ({ page, context }) => {
    await loginAs(page, "100001");

    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === "prfc_auth");

    expect(authCookie).toBeDefined();
    expect(authCookie!.httpOnly).toBe(true);
  });

  test("auth cookie is SameSite Lax", async ({ page, context }) => {
    await loginAs(page, "100001");

    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === "prfc_auth");

    expect(authCookie).toBeDefined();
    expect(authCookie!.sameSite).toBe("Lax");
  });
});

test.describe("Unauthenticated access to protected pages", () => {
  const protectedPaths = ["/home", "/groups", "/events", "/messages", "/settings", "/profile", "/referral-database"];

  for (const path of protectedPaths) {
    test(`${path} redirects to /unauthorized`, async ({ page }) => {
      await page.goto(path);
      expect(page.url()).toContain("/unauthorized");
    });
  }
});

test.describe("Public pages load without auth", () => {
  test("/unauthorized loads", async ({ page }) => {
    await page.goto("/unauthorized");
    await expect(page.getByText("Sign in required")).toBeVisible();
  });

  test("/terms loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("body")).toBeVisible();
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });

  test("/privacy loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText("Data sharing")).toBeVisible();
  });
});

test.describe("Logout flow", () => {
  test("logout clears session and blocks protected page access", async ({ page }) => {
    await loginAs(page, "100001");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const userMenu = page.locator("#user-menu-trigger");
    await userMenu.click();
    await page.getByRole("menuitem", { name: "Back to Portal" }).click();
    await page.waitForTimeout(500);

    await page.goto("/home");
    expect(page.url()).toContain("/unauthorized");
  });
});

test.describe("Group ID enumeration", () => {
  test("member accessing /groups/1 is blocked", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/groups/1");

    const forbidden = page.url().includes("/forbidden");
    const notFound = page.getByText("not found");
    const isSafe = forbidden || (await notFound.isVisible().catch(() => false));
    expect(isSafe).toBe(true);
  });
});

test.describe("Unauthenticated API access", () => {
  test("GET /api/members returns 401+", async ({ page }) => {
    const response = await page.request.get("/api/members");
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("GET /api/referrals returns 401+", async ({ page }) => {
    const response = await page.request.get("/api/referrals");
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
