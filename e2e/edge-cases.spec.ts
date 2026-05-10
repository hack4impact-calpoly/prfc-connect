import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, ownerid: string) {
  await page.goto("/dev/mock-portal");
  await page.getByText("Dev Tools").click();
  await page.getByLabel("Select Member").selectOption(ownerid);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("/home");
}

test.describe("Duplicate data edge cases", () => {
  test("duplicate contact list names are both created", async ({ page }) => {
    await loginAs(page, "100001");
    const dupName = `Dup List ${Date.now()}`;

    await page.goto("/groups?create=true");
    await page.getByPlaceholder("Group Name").fill(dupName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Group created")).toBeVisible({ timeout: 10000 });

    await page.goto("/groups?create=true");
    await page.getByPlaceholder("Group Name").fill(dupName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Group created")).toBeVisible({ timeout: 10000 });

    await page.goto("/groups");
    const cards = page.getByText(dupName);
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Calendar display edge cases", () => {
  test("event with 200-character title does not crash calendar", async ({ page }) => {
    await loginAs(page, "100001");
    await page.goto("/events?create=true");

    const longTitle = "A".repeat(200);
    await page.getByPlaceholder("New Event Title").fill(longTitle);
    await page.getByRole("button", { name: "Social" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Event created")).toBeVisible({ timeout: 10000 });

    await page.goto("/events");
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });
});

test.describe("Referral code edge cases", () => {
  test("fabricated referral code does not crash form", async ({ page }) => {
    await page.goto("/?nm=Fake&em=fake@test.com&ref=INVALID999");
    await expect(page.getByRole("main")).toBeVisible();
    const errorOverlay = page.locator("[data-nextjs-dialog]");
    expect(await errorOverlay.count()).toBe(0);
  });
});
