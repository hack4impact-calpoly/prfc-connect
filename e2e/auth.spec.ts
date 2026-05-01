import { test, expect } from "@playwright/test";

const PROTECTED_PAGES = [
  "/home",
  "/groups",
  "/events",
  "/messages",
  "/messages/compose",
  "/settings",
  "/profile",
  "/referral-database",
];

test.describe("Unauthenticated access to protected pages", () => {
  for (const path of PROTECTED_PAGES) {
    test(`${path} without cookie redirects to /unauthorized`, async ({ page }) => {
      await page.goto(path);

      expect(page.url()).toContain("/unauthorized");
      await expect(page.getByText("Sign in required")).toBeVisible();
    });
  }
});

test.describe("Unauthenticated API access", () => {
  test("GET /api/members returns 401", async ({ request }) => {
    const response = await request.get("/api/members");
    expect(response.status()).toBe(401);
  });

  test("GET /api/members/100001 returns 401", async ({ request }) => {
    const response = await request.get("/api/members/100001");
    expect(response.status()).toBe(401);
  });

  test("GET /api/referrals returns 401", async ({ request }) => {
    const response = await request.get("/api/referrals");
    expect(response.status()).toBe(401);
  });

  test("PATCH /api/referrals/1 returns 401", async ({ request }) => {
    const response = await request.patch("/api/referrals/1", { data: { redeemed: true } });
    expect(response.status()).toBe(401);
  });

  test("DELETE /api/referrals/1 returns 401", async ({ request }) => {
    const response = await request.delete("/api/referrals/1");
    expect(response.status()).toBe(401);
  });
});

test.describe("Expired or tampered cookie on protected pages", () => {
  for (const path of PROTECTED_PAGES) {
    test(`${path} with invalid cookie redirects to /unauthorized`, async ({ page, context }) => {
      await context.addCookies([{ name: "prfc_auth", value: "tampered|0|0|bad", domain: "localhost", path: "/" }]);
      await page.goto(path);

      expect(page.url()).toContain("/unauthorized");
      await expect(page.getByText("Sign in required")).toBeVisible();
    });
  }
});

test.describe("Forbidden access for non-admin members", () => {
  test("/referral-database redirects member to /forbidden", async ({ page }) => {
    await page.goto("/dev/mock-portal");
    await page.getByText("Dev Tools").click();
    await page.getByLabel("Select Member").selectOption("100003");
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("/home");

    await page.goto("/referral-database");

    expect(page.url()).toContain("/forbidden");
    await expect(page.getByText("No permission")).toBeVisible();
  });
});

test.describe("Invalid auth token", () => {
  test("auth callback with bad token redirects to /", async ({ request }) => {
    const response = await request.post("/api/auth/callback", {
      form: { token: "invalid-token-value" },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toContain("/");
  });

  test("auth callback with empty token redirects to /", async ({ request }) => {
    const response = await request.post("/api/auth/callback", {
      form: { token: "" },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toContain("/");
  });
});

test.describe("Back after logout", () => {
  test("navigating to protected page after logout does not show protected content", async ({ page }) => {
    await page.goto("/dev/mock-portal");
    await page.getByText("Dev Tools").click();
    await page.getByLabel("Select Member").selectOption("100001");
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("/home");

    await expect(page.getByLabel("User menu")).toBeVisible();

    await page.getByLabel("User menu").click();
    await expect(page.getByRole("menuitem", { name: "Back to Portal" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Back to Portal" }).click();
    await expect(page).toHaveURL("/dev/mock-portal");

    const response = await page.goto("/home");
    const status = response?.status() ?? 0;
    const url = page.url();

    const isRedirected = !url.includes("/home");
    const isErrorStatus = status >= 400;
    expect(isRedirected || isErrorStatus).toBe(true);
  });
});
