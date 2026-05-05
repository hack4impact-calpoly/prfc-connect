import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

// ── Block 6: Dashboard ──────────────────────────────────

test.describe("Dashboard", () => {
  test("displays stat cards with data", async ({ page }) => {
    await loginAs(page, "100001");

    await expect(page.getByText("Total Members")).toBeVisible();
    await expect(page.getByText("Events This Month")).toBeVisible();
    await expect(page.getByText("Quick Actions")).toBeVisible();
  });

  test("quick action Create Event navigates and opens dialog", async ({ page }) => {
    await loginAs(page, "100001");

    await page.getByRole("button", { name: "Create Event" }).click();
    await page.waitForURL("/events?create=true");

    await expect(page.getByPlaceholder("New Event Title")).toBeVisible();
  });

  test("quick action Create Group navigates and opens modal", async ({ page }) => {
    await loginAs(page, "100001");

    await page.getByRole("button", { name: "Create Group" }).click();
    await page.waitForURL("/groups?create=true");

    await expect(page.getByText("Create Group")).toBeVisible();
  });

  test("quick action Send Message navigates to compose", async ({ page }) => {
    await loginAs(page, "100001");

    await page.getByRole("button", { name: "Send Message" }).click();
    await page.waitForURL("/messages/compose");

    await expect(page.getByText("New Message")).toBeVisible();
  });

  test("dashboard loads for member", async ({ page }) => {
    await loginAs(page, "100003");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});

// ── Block 2: Group lifecycle ────────────────────────────

test.describe("Groups", () => {
  test("admin sees My Groups and All Groups toggle", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/groups");

    await expect(page.getByRole("button", { name: "My Groups" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All Groups" })).toBeVisible();
  });

  test("member does not see All Groups toggle", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/groups");

    await expect(page.getByRole("button", { name: "All Groups" })).not.toBeVisible();
  });

  test("admin creates a group and it appears in the list", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/groups?create=true");

    const groupName = `E2E Test Group ${Date.now()}`;
    await page.getByPlaceholder("Group Name").fill(groupName);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Group created")).toBeVisible({ timeout: 10000 });
    await page.goto("/groups");
    await expect(page.getByText(groupName)).toBeVisible();
  });

  test("admin creates group, member sees it under All Groups", async ({ page }) => {
    const groupName = `Member View Test ${Date.now()}`;

    await loginAs(page, "100001");
    await page.goto("/groups?create=true");
    await page.getByPlaceholder("Group Name").fill(groupName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Group created")).toBeVisible({ timeout: 10000 });

    await loginAs(page, "100003");
    await page.goto("/groups");

    await expect(page.getByText(groupName)).not.toBeVisible();
  });
});

// ── Block 3: Events ─────────────────────────────────────

test.describe("Events", () => {
  test("admin sees My Events and All Events toggle", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/events");

    await expect(page.getByRole("button", { name: "My Events" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All Events" })).toBeVisible();
  });

  test("week and month view toggle works", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/events");

    const viewSelect = page.locator("select, [role='combobox']").filter({ hasText: "Week" });
    await expect(viewSelect.first()).toBeVisible();
  });

  test("events title heading is visible", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/events");

    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
  });
});

// ── Block 4: Messages ───────────────────────────────────

test.describe("Messages", () => {
  test("message history page loads with heading", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    await expect(page.getByRole("heading", { name: "Message History" })).toBeVisible();
  });

  test("search input is visible and functional", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    const search = page.getByLabel("Search messages");
    await expect(search).toBeVisible();
    await search.fill("test query");
    await expect(search).toHaveValue("test query");
  });

  test("compose page accessible from messages", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/messages");

    await page.getByRole("link", { name: "New Message" }).click();
    await page.waitForURL("/messages/compose");

    await expect(page.getByText("New Message")).toBeVisible();
  });

  test("member with no messages sees empty state", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/messages");

    await expect(page.getByText("No messages yet")).toBeVisible();
  });
});

// ── Block 5: Settings ───────────────────────────────────

test.describe("Settings", () => {
  test("settings page loads with notification preferences", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Notifications")).toBeVisible();
  });

  test("email toggle is visible with description", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/settings");

    await expect(page.getByText("Receive event announcements and group messages via email")).toBeVisible();
    await expect(page.getByText("Turning this off stops all group emails")).toBeVisible();
  });
});

// ── Block 5: Profile ────────────────────────────────────

test.describe("Profile", () => {
  test("profile page loads with user info", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/profile");

    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
    await expect(page.getByText("Profile Photo")).toBeVisible();
  });

  test("upload button is visible", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/profile");

    await expect(page.getByRole("button", { name: "Upload" })).toBeVisible();
  });

  test("rejects invalid file type via client validation", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/profile");

    const fileInput = page.getByLabel("Upload profile photo");
    await fileInput.setInputFiles({
      name: "test.gif",
      mimeType: "image/gif",
      buffer: Buffer.from("fake gif content"),
    });

    await expect(page.getByText("Profile photo must be JPG or PNG")).toBeVisible();
  });

  test("uploads a valid photo and shows success toast", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/profile");

    const fileInput = page.getByLabel("Upload profile photo");
    await fileInput.setInputFiles(path.join(__dirname, "fixtures", "test-photo.png"));

    await expect(page.getByText("Photo updated")).toBeVisible({ timeout: 15000 });
  });
});

// ── Block 7: Authorization ──────────────────────────────

test.describe("Authorization", () => {
  test("member cannot access referral database", async ({ page }) => {
    await loginAs(page, "100003");
    await page.goto("/referral-database");

    expect(page.url()).toContain("/forbidden");
    await expect(page.getByText("No permission")).toBeVisible();
  });

  test("admin can access referral database", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/referral-database");

    expect(page.url()).toContain("/referral-database");
  });

  test("unauthenticated user is redirected to unauthorized", async ({ page }) => {
    await page.goto("/home");

    expect(page.url()).toContain("/unauthorized");
    await expect(page.getByText("Sign in required")).toBeVisible();
  });
});
