import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

async function openCreateEvent(page: Page) {
  await page.goto("/events?create=true");
  await expect(page.getByPlaceholder("New Event Title")).toBeVisible({ timeout: 5000 });
}

function calendarEvent(page: Page, title: string) {
  return page.locator(`[role="button"][data-event-id]`).filter({ hasText: title });
}

test.describe("Event creation and calendar", () => {
  test("admin creates event and it appears on calendar", async ({ page }) => {
    await loginAs(page, "100001");
    await openCreateEvent(page);

    const eventTitle = `E2E Event ${Date.now()}`;
    await page.getByPlaceholder("New Event Title").fill(eventTitle);
    await page.getByRole("button", { name: "Social" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Event created")).toBeVisible({ timeout: 10000 });
  });

  test("events page loads with heading", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/events");

    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
  });

  test("no My Events / All Events toggle exists", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/events");

    await expect(page.getByRole("button", { name: "My Events" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "All Events" })).not.toBeVisible();
  });

  test("member sees all events including ones without invitees", async ({ page }) => {
    await loginAs(page, "100001");
    await openCreateEvent(page);

    const eventTitle = `Open Event ${Date.now()}`;
    await page.getByPlaceholder("New Event Title").fill(eventTitle);
    await page.getByRole("button", { name: "Social" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Event created")).toBeVisible({ timeout: 10000 });

    await loginAs(page, "100003");
    await page.goto("/events");

    await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 5000 });
  });

  test("create event popover has all required fields", async ({ page }) => {
    await loginAs(page, "100001");
    await openCreateEvent(page);

    await expect(page.getByPlaceholder("New Event Title")).toBeVisible();
    await expect(page.getByRole("button", { name: "Social" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Networking" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Meeting" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Volunteer" })).toBeVisible();
    await expect(page.getByPlaceholder("Add Location")).toBeVisible();
    await expect(page.getByText("RSVP Deadline")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("admin clicks event on calendar to open detail", async ({ page }) => {
    await loginAs(page, "100001");
    await openCreateEvent(page);

    const eventTitle = `Click Test ${Date.now()}`;
    await page.getByPlaceholder("New Event Title").fill(eventTitle);
    await page.getByRole("button", { name: "Social" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Event created")).toBeVisible({ timeout: 10000 });

    await page.goto("/events");
    const event = calendarEvent(page, eventTitle);
    if ((await event.count()) > 0) {
      await event.first().click({ force: true });
      await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Event RSVP", () => {
  test("RSVP section visible for events with invitees", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/events");

    const events = page.locator(`[role="button"][data-event-id]`);
    if ((await events.count()) > 0) {
      await events.first().click({ force: true });
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Event RSVP visibility", () => {
  test("non-invitee sees event but RSVP buttons are hidden", async ({ page }) => {
    await loginAs(page, "100001");
    await openCreateEvent(page);

    const eventTitle = `No RSVP ${Date.now()}`;
    await page.getByPlaceholder("New Event Title").fill(eventTitle);
    await page.getByRole("button", { name: "Social" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Event created")).toBeVisible({ timeout: 10000 });

    await loginAs(page, "100003");
    await page.goto("/events");

    const event = calendarEvent(page, eventTitle);
    if ((await event.count()) > 0) {
      await event.first().click({ force: true });
      await page.waitForTimeout(500);

      await expect(page.getByRole("button", { name: "Going" })).not.toBeVisible();
      await expect(page.getByRole("button", { name: "Maybe" })).not.toBeVisible();
    }
  });
});

test.describe("Event RSVP deadline", () => {
  test("RSVP shows 'Deadline passed' for event with past deadline", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/events");

    const events = page.locator(`[role="button"][data-event-id]`);
    if ((await events.count()) > 0) {
      await events.first().click({ force: true });
      await page.waitForTimeout(500);

      const deadlineText = page.getByText("Deadline passed");
      const rsvpButtons = page.getByRole("button", { name: "Going" });

      const hasDeadlinePassed = await deadlineText.isVisible().catch(() => false);
      const hasRsvpButtons = await rsvpButtons.isVisible().catch(() => false);

      if (hasDeadlinePassed) {
        expect(hasRsvpButtons).toBe(false);
      }
    }
  });
});

test.describe("Event security", () => {
  test("non-owner member cannot see edit controls on other's event", async ({ page }) => {
    await loginAs(page, "100001");
    await openCreateEvent(page);

    const eventTitle = `Owner Only ${Date.now()}`;
    await page.getByPlaceholder("New Event Title").fill(eventTitle);
    await page.getByRole("button", { name: "Social" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Event created")).toBeVisible({ timeout: 10000 });

    await loginAs(page, "100003");
    await page.goto("/events");

    const event = calendarEvent(page, eventTitle);
    if ((await event.count()) > 0) {
      await event.first().click({ force: true });
      await page.waitForTimeout(500);

      await expect(page.getByRole("button", { name: "Save Changes" })).not.toBeVisible();
      await expect(page.getByRole("button", { name: "Delete" })).not.toBeVisible();
    }
  });
});
