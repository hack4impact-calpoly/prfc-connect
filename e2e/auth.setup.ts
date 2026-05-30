import { test as setup, expect } from "@playwright/test";

// Disabled: the mock-portal dev login was removed for production hardening, so
// these setups can no longer mint a session cookie. Re-enable once the real
// member-portal login flow can issue a prfc_auth cookie this setup can capture.
setup.skip(() => true, "mock-portal removed; pending real portal login flow");

const ADMIN_AUTH_FILE = "playwright/.auth/admin.json";
const MEMBER_AUTH_FILE = "playwright/.auth/member.json";

// Admin: ownerid 100001 (first mock member, in mockAdminIds)
// Member: ownerid 100003 (third mock member, not in mockAdminIds)
// Admin status is derived from mockAdminIds (first two members are admins)

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/dev/mock-portal");

  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption("100001");
  await page.getByRole("button", { name: "Login" }).click();

  await page.waitForURL("/home");
  await expect(page).toHaveURL("/home");
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});

setup("authenticate as member", async ({ page }) => {
  await page.goto("/dev/mock-portal");

  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption("100003");
  await page.getByRole("button", { name: "Login" }).click();

  await page.waitForURL("/home");
  await expect(page).toHaveURL("/home");
  await page.context().storageState({ path: MEMBER_AUTH_FILE });
});
