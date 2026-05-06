import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const TEST_PHOTO_PATH = path.join(__dirname, "fixtures", "test-photo.png");

function ensureTestPhoto() {
  const dir = path.join(__dirname, "fixtures");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(TEST_PHOTO_PATH)) {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64",
    );
    fs.writeFileSync(TEST_PHOTO_PATH, png);
  }
}

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

function getHeaderAvatar(page: Page) {
  return page.locator("#user-menu-trigger img");
}

async function assertHeaderPhotoVisible(page: Page) {
  await page.waitForLoadState("networkidle");
  await expect(getHeaderAvatar(page)).toBeVisible({ timeout: 10000 });
}

async function assertHeaderPhotoHidden(page: Page) {
  await expect(getHeaderAvatar(page)).not.toBeVisible({ timeout: 5000 });
}

test.describe.serial("Profile photo cross-session sync", () => {
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;

  test.beforeAll(() => {
    ensureTestPhoto();
  });

  test.beforeEach(async ({ browser }) => {
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();

    await loginAs(pageA, "100001");
    await loginAs(pageB, "100001");
  });

  test.afterEach(async () => {
    await contextA.close();
    await contextB.close();
  });

  test("session B uploads photo, both sessions see it on every page", async () => {
    await pageB.goto("/profile");
    const fileInput = pageB.getByLabel("Upload profile photo");
    await fileInput.setInputFiles(TEST_PHOTO_PATH);
    await expect(pageB.getByText("Photo updated")).toBeVisible({ timeout: 15000 });

    await pageB.goto("/home");
    await assertHeaderPhotoVisible(pageB);

    await pageB.goto("/messages");
    await assertHeaderPhotoVisible(pageB);

    await pageB.goto("/events");
    await assertHeaderPhotoVisible(pageB);

    await pageB.goto("/groups");
    await assertHeaderPhotoVisible(pageB);

    await pageB.goto("/settings");
    await assertHeaderPhotoVisible(pageB);

    await pageA.goto("/home");
    await assertHeaderPhotoVisible(pageA);

    await pageA.goto("/messages");
    await assertHeaderPhotoVisible(pageA);

    await pageA.goto("/events");
    await assertHeaderPhotoVisible(pageA);

    await pageA.goto("/groups");
    await assertHeaderPhotoVisible(pageA);

    await pageA.goto("/settings");
    await assertHeaderPhotoVisible(pageA);

    await pageA.goto("/profile");
    await assertHeaderPhotoVisible(pageA);
    await expect(pageA.getByRole("button", { name: "Remove" })).toBeVisible({ timeout: 5000 });
  });

  test("session B deletes photo, both sessions see it removed on every page", async () => {
    await pageB.goto("/profile");
    await expect(pageB.getByRole("button", { name: "Remove" })).toBeVisible({ timeout: 5000 });
    await pageB.getByRole("button", { name: "Remove" }).click();
    await expect(pageB.getByText("Photo removed")).toBeVisible({ timeout: 10000 });

    await pageB.goto("/home");
    await assertHeaderPhotoHidden(pageB);

    await pageB.goto("/messages");
    await assertHeaderPhotoHidden(pageB);

    await pageB.goto("/events");
    await assertHeaderPhotoHidden(pageB);

    await pageA.goto("/home");
    await assertHeaderPhotoHidden(pageA);

    await pageA.goto("/messages");
    await assertHeaderPhotoHidden(pageA);

    await pageA.goto("/profile");
    await assertHeaderPhotoHidden(pageA);
    await expect(pageA.getByRole("button", { name: "Remove" })).not.toBeVisible();
  });
});
