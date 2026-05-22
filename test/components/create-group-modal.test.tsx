import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { CreateGroupModal } from "@/components/groups/create-group-modal";

const MEMBERS = [
  { memberId: 100001, ownername: "Member Alpha" },
  { memberId: 100002, ownername: "Member Bravo" },
  { memberId: 100003, ownername: "Member Charlie" },
];

describe("CreateGroupModal owner pre-selection", () => {
  it("owner checkbox is checked and disabled on open", () => {
    render(
      <CreateGroupModal open={true} onOpenChange={vi.fn()} onSubmit={vi.fn()} members={MEMBERS} ownerId={100001} />,
    );

    const ownerCheckbox = screen.getByLabelText("Select Member Alpha");
    expect(ownerCheckbox).toBeChecked();
    expect(ownerCheckbox).toBeDisabled();
  });

  it("owner cannot be deselected by clicking", async () => {
    const user = userEvent.setup();
    render(
      <CreateGroupModal open={true} onOpenChange={vi.fn()} onSubmit={vi.fn()} members={MEMBERS} ownerId={100001} />,
    );

    const ownerCheckbox = screen.getByLabelText("Select Member Alpha");
    await user.click(ownerCheckbox);

    expect(ownerCheckbox).toBeChecked();
  });

  it("includes owner in submitted memberIds", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CreateGroupModal open={true} onOpenChange={vi.fn()} onSubmit={onSubmit} members={MEMBERS} ownerId={100001} />,
    );

    const nameInput = screen.getByPlaceholderText("Group Name");
    await user.type(nameInput, "Test Group");

    const form = nameInput.closest("form")!;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        memberIds: expect.arrayContaining([100001]),
      }),
    );
  });
});
