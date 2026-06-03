import { test as setup, type Browser } from "@playwright/test";
import { createHmac } from "crypto";
import { E2E_PORTAL_SECRET } from "./auth-constants";

const ADMIN_AUTH_FILE = "playwright/.auth/admin.json";
const MEMBER_AUTH_FILE = "playwright/.auth/member.json";

// Admin: ownerid 100001 (in mockAdminIds). Member: ownerid 100003 (not an admin).
// The real portal login is external, so we mint the prfc_auth session cookie
// directly here, mirroring generateToken in src/lib/dal.ts. The dev server uses
// the same E2E_PORTAL_SECRET (set in playwright.config.ts webServer.env), so the
// cookie validates.
function mintSessionToken(ownerid: number, isAdmin: boolean): string {
  const timestamp = Date.now().toString();
  const payload = `${ownerid}|${isAdmin ? "1" : "0"}|${timestamp}`;
  const signature = createHmac("sha256", E2E_PORTAL_SECRET).update(payload).digest("hex").slice(0, 8);
  return `${payload}|${signature}`;
}

async function saveSession(browser: Browser, ownerid: number, isAdmin: boolean, file: string) {
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: "prfc_auth",
      value: mintSessionToken(ownerid, isAdmin),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await context.storageState({ path: file });
  await context.close();
}

setup("authenticate as admin", async ({ browser }) => {
  await saveSession(browser, 100001, true, ADMIN_AUTH_FILE);
});

setup("authenticate as member", async ({ browser }) => {
  await saveSession(browser, 100003, false, MEMBER_AUTH_FILE);
});
