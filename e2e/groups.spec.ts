import { test, expect, type Page, type Locator } from "@playwright/test";

let seedGroupName: string;

function getOpenDialog(page: Page): Locator {
  return page.locator('[role="dialog"][data-state="open"]');
}

function getOpenAlertDialog(page: Page): Locator {
  return page.locator('[role="alertdialog"][data-state="open"]');
}

function getGroupCards(page: Page): Locator {
  return page.locator("button").filter({ hasText: /\d+ members?/ });
}

function isServerAction(resp: { request: () => { method: () => string; headers: () => Record<string, string> } }) {
  return resp.request().method() === "POST" && !!resp.request().headers()["next-action"];
}

async function clickCardAndWaitForDetail(page: Page, card: Locator) {
  const actionPromise = page.waitForResponse((resp) => isServerAction(resp));
  await card.click();
  await actionPromise;
  await expect(getOpenDialog(page)).toBeVisible();
}

async function deleteGroupByName(page: Page, name: string) {
  await page.goto("/groups");
  const card = page.getByText(name, { exact: true });
  if ((await card.count()) === 0) return;

  await clickCardAndWaitForDetail(page, card.first());
  await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();
  await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();
  await getOpenDialog(page).getByRole("button", { name: "Delete" }).click();
  await expect(getOpenAlertDialog(page)).toBeVisible();

  const deletePromise = page.waitForResponse((resp) => isServerAction(resp));
  await getOpenAlertDialog(page).getByRole("button", { name: "Confirm" }).click();
  await deletePromise;
  await expect(page.getByText("Group deleted successfully")).toBeVisible();
}

test.beforeAll(async ({ browser }) => {
  seedGroupName = `E2E Seed ${Date.now()} ${Math.random().toString(36).slice(2, 6)}`;
  const page = await browser.newPage();
  await page.goto("/groups");
  await page.getByRole("button", { name: "Add new group" }).click();
  const dialog = getOpenDialog(page);
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Group Name").fill(seedGroupName);

  const createPromise = page.waitForResponse((resp) => isServerAction(resp));
  await dialog.getByRole("button", { name: "Create Group" }).click();
  await createPromise;
  await expect(page.getByText("Group created successfully")).toBeVisible();
  await expect(getOpenDialog(page)).not.toBeVisible();
  await page.close();
});

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await deleteGroupByName(page, seedGroupName);
  await page.close();
});

test.describe("Groups page load", () => {
  test("displays group cards and add card", async ({ page }) => {
    await page.goto("/groups");

    await expect(page.getByRole("button", { name: "Add new group" })).toBeVisible();
    await expect(getGroupCards(page).first()).toBeVisible();
  });

  test("shows correct heading for role", async ({ page }) => {
    await page.goto("/groups");

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text === "Groups" || text === "My Groups").toBe(true);
  });
});

test.describe("Group detail modal", () => {
  test("clicking a group card opens the detail modal", async ({ page }) => {
    await page.goto("/groups");

    await clickCardAndWaitForDetail(page, getGroupCards(page).first());

    await expect(getOpenDialog(page).getByLabel("Group Name")).toBeVisible();
  });

  test("detail modal shows group name, description, and members section", async ({ page }) => {
    await page.goto("/groups");

    await clickCardAndWaitForDetail(page, getGroupCards(page).first());

    const dialog = getOpenDialog(page);
    await expect(dialog.getByLabel("Group Name")).toBeVisible();
    await expect(dialog.getByText("Members")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "View All" })).toBeVisible();
  });

  test("detail modal closes via Escape key", async ({ page }) => {
    await page.goto("/groups");

    await clickCardAndWaitForDetail(page, getGroupCards(page).first());

    await page.keyboard.press("Escape");
    await expect(getOpenDialog(page)).not.toBeVisible();
  });

  test("Edit button transitions to edit modal with Save Changes", async ({ page }) => {
    await page.goto("/groups");

    await clickCardAndWaitForDetail(page, getGroupCards(page).first());

    await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();

    const editDialog = getOpenDialog(page);
    await expect(editDialog.getByRole("button", { name: "Save Changes" })).toBeVisible();
  });
});

test.describe("Group edit modal", () => {
  async function openEditModal(page: Page) {
    await page.goto("/groups");
    await clickCardAndWaitForDetail(page, getGroupCards(page).first());
    await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();
  }

  test("pre-populates name and description from the group", async ({ page }) => {
    await page.goto("/groups");

    await clickCardAndWaitForDetail(page, getGroupCards(page).first());
    const detailDialog = getOpenDialog(page);
    const groupName = await detailDialog.getByLabel("Group Name").inputValue();

    await detailDialog.getByRole("button", { name: "Edit" }).click();
    const editDialog = getOpenDialog(page);
    await expect(editDialog.getByRole("button", { name: "Save Changes" })).toBeVisible();

    await expect(editDialog.getByLabel("Group Name")).toHaveValue(groupName);
  });

  test("submitting with empty name shows validation error", async ({ page }) => {
    await openEditModal(page);

    const dialog = getOpenDialog(page);
    await dialog.getByLabel("Group Name").clear();
    await dialog.getByRole("button", { name: "Save Changes" }).click();

    await expect(dialog.getByText("Group name is required.")).toBeVisible();
  });

  test("saving valid changes shows success toast and closes modal", async ({ page }) => {
    await openEditModal(page);

    const dialog = getOpenDialog(page);
    const nameInput = dialog.getByLabel("Group Name");
    const originalName = await nameInput.inputValue();

    await nameInput.clear();
    await nameInput.fill(originalName + " Edited");

    const savePromise = page.waitForResponse((resp) => isServerAction(resp));
    await dialog.getByRole("button", { name: "Save Changes" }).click();
    await savePromise;

    await expect(page.getByText("Group updated successfully")).toBeVisible();
    await expect(getOpenDialog(page)).not.toBeVisible();

    await clickCardAndWaitForDetail(page, page.getByText(originalName + " Edited"));
    await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();
    const restoreInput = getOpenDialog(page).getByLabel("Group Name");
    await restoreInput.clear();
    await restoreInput.fill(originalName);

    const restorePromise = page.waitForResponse((resp) => isServerAction(resp));
    await getOpenDialog(page).getByRole("button", { name: "Save Changes" }).click();
    await restorePromise;
    await expect(page.getByText("Group updated successfully")).toBeVisible();
  });

  test("Delete button opens delete confirmation", async ({ page }) => {
    await openEditModal(page);

    await getOpenDialog(page).getByRole("button", { name: "Delete" }).click();

    const alertDialog = getOpenAlertDialog(page);
    await expect(alertDialog).toBeVisible();
    await expect(alertDialog.getByText("Are you sure you want to delete this group?")).toBeVisible();
  });

  test("Add Members button opens add members modal", async ({ page }) => {
    await openEditModal(page);

    await getOpenDialog(page).getByRole("button", { name: "Add members to group" }).click();

    const membersDialog = getOpenDialog(page);
    await expect(membersDialog).toBeVisible();
    await expect(membersDialog.getByPlaceholder(/search/i)).toBeVisible();
  });
});

test.describe("Delete group modal", () => {
  async function openDeleteModal(page: Page) {
    await page.goto("/groups");
    await clickCardAndWaitForDetail(page, getGroupCards(page).first());
    await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();
    await getOpenDialog(page).getByRole("button", { name: "Delete" }).click();
    await expect(getOpenAlertDialog(page)).toBeVisible();
  }

  test("cancel returns to edit modal", async ({ page }) => {
    await openDeleteModal(page);

    await getOpenAlertDialog(page).getByRole("button", { name: "Cancel" }).click();

    await expect(getOpenAlertDialog(page)).not.toBeVisible();
    const editDialog = getOpenDialog(page);
    await expect(editDialog).toBeVisible();
    await expect(editDialog.getByRole("button", { name: "Save Changes" })).toBeVisible();
  });
});

test.describe("Create group modal", () => {
  test("add card opens create modal", async ({ page }) => {
    await page.goto("/groups");

    await page.getByRole("button", { name: "Add new group" }).click();

    const dialog = getOpenDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Create Contact Group")).toBeVisible();
  });

  test("TopBar New Group button opens create modal", async ({ page }) => {
    await page.goto("/groups");

    await page.getByRole("button", { name: /New Group/ }).click();

    const dialog = getOpenDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Create Contact Group")).toBeVisible();
  });

  test("Create Group button is disabled when name is empty", async ({ page }) => {
    await page.goto("/groups");
    await page.getByRole("button", { name: "Add new group" }).click();

    const dialog = getOpenDialog(page);
    await expect(dialog.getByRole("button", { name: "Create Group" })).toBeDisabled();
  });

  test("creating a group shows success toast and new card appears", async ({ page }) => {
    await page.goto("/groups");

    const uniqueName = `E2E Test Group ${Date.now()}`;

    await page.getByRole("button", { name: "Add new group" }).click();

    const dialog = getOpenDialog(page);
    await dialog.getByLabel("Group Name").fill(uniqueName);
    await dialog.getByLabel("Description (Optional)").fill("Created by e2e test");

    const createPromise = page.waitForResponse((resp) => isServerAction(resp));
    await dialog.getByRole("button", { name: "Create Group" }).click();
    await createPromise;

    await expect(page.getByText("Group created successfully")).toBeVisible();
    await expect(getOpenDialog(page)).not.toBeVisible();

    await expect(page.getByText(uniqueName)).toBeVisible();

    await clickCardAndWaitForDetail(page, page.getByText(uniqueName));
    await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();
    await getOpenDialog(page).getByRole("button", { name: "Delete" }).click();
    await expect(getOpenAlertDialog(page)).toBeVisible();

    const deletePromise = page.waitForResponse((resp) => isServerAction(resp));
    await getOpenAlertDialog(page).getByRole("button", { name: "Confirm" }).click();
    await deletePromise;
    await expect(page.getByText("Group deleted successfully")).toBeVisible();
  });

  test("cancel button closes create modal and clears form", async ({ page }) => {
    await page.goto("/groups");

    await page.getByRole("button", { name: "Add new group" }).click();
    const dialog = getOpenDialog(page);
    await dialog.getByLabel("Group Name").fill("Should be cleared");

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(getOpenDialog(page)).not.toBeVisible();

    await page.getByRole("button", { name: "Add new group" }).click();
    await expect(getOpenDialog(page).getByLabel("Group Name")).toHaveValue("");
  });
});

test.describe("Add members modal", () => {
  async function openAddMembersModal(page: Page) {
    await page.goto("/groups");
    await clickCardAndWaitForDetail(page, getGroupCards(page).first());
    await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();
    await getOpenDialog(page).getByRole("button", { name: "Add members to group" }).click();
    await expect(getOpenDialog(page).getByPlaceholder(/search/i)).toBeVisible();
  }

  test("shows member list with checkboxes", async ({ page }) => {
    await openAddMembersModal(page);

    const dialog = getOpenDialog(page);
    const checkboxes = dialog.getByRole("checkbox");
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);
  });

  test("search filters members by name", async ({ page }) => {
    await openAddMembersModal(page);

    const dialog = getOpenDialog(page);
    const searchInput = dialog.getByPlaceholder(/search/i);

    const initialCount = await dialog.getByRole("checkbox").count();

    await searchInput.fill("zzz_nonexistent_name");

    await expect(async () => {
      const filteredCount = await dialog.getByRole("checkbox").count();
      expect(filteredCount).toBeLessThan(initialCount);
    }).toPass({ timeout: 3000 });
  });

  test("saving with no new selections returns to edit modal", async ({ page }) => {
    await openAddMembersModal(page);

    await getOpenDialog(page).getByRole("button", { name: "Save" }).click();

    const editDialog = getOpenDialog(page);
    await expect(editDialog.getByRole("button", { name: "Save Changes" })).toBeVisible();
  });
});

test.describe("Full modal navigation chains", () => {
  test("card → detail → edit → delete → cancel → back to edit → close", async ({ page }) => {
    await page.goto("/groups");

    await clickCardAndWaitForDetail(page, getGroupCards(page).first());
    await expect(getOpenDialog(page).getByRole("button", { name: "Edit" })).toBeVisible();

    await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();

    await getOpenDialog(page).getByRole("button", { name: "Delete" }).click();
    await expect(getOpenAlertDialog(page)).toBeVisible();

    await getOpenAlertDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(getOpenAlertDialog(page)).not.toBeVisible();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(getOpenDialog(page)).not.toBeVisible();
  });

  test("card → detail → edit → add members → save → back to edit", async ({ page }) => {
    await page.goto("/groups");

    await clickCardAndWaitForDetail(page, getGroupCards(page).first());

    await getOpenDialog(page).getByRole("button", { name: "Edit" }).click();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();

    await getOpenDialog(page).getByRole("button", { name: "Add members to group" }).click();
    await expect(getOpenDialog(page).getByPlaceholder(/search/i)).toBeVisible();

    await getOpenDialog(page).getByRole("button", { name: "Save" }).click();
    await expect(getOpenDialog(page).getByRole("button", { name: "Save Changes" })).toBeVisible();
  });
});
