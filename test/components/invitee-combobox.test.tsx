import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { InviteeCombobox } from "@/components/events/invitee-combobox";
import { TopBarSearchProvider } from "@/components/layout/top-bar-search-context";

function wrap(ui: React.ReactElement) {
  return <TopBarSearchProvider>{ui}</TopBarSearchProvider>;
}

const GROUPS = [
  { id: 1, name: "Board of Directors", memberCount: 7 },
  { id: 2, name: "Volunteers", memberCount: 23 },
];

const MEMBERS = [
  { ownerid: 100001, ownername: "Kevin Rutledge" },
  { ownerid: 100002, ownername: "Mary Jones" },
];

describe("InviteeCombobox", () => {
  it("renders empty state when no groups or members", () => {
    render(
      wrap(
        <InviteeCombobox
          groups={[]}
          members={[]}
          selectedGroupIds={new Set()}
          selectedMemberIds={new Set()}
          onToggleGroup={vi.fn()}
          onToggleMember={vi.fn()}
        />,
      ),
    );
    fireEvent.click(screen.getByText("Add Group/Members"));
    expect(screen.getByText("Nothing to invite yet.")).toBeInTheDocument();
  });

  it("shows selected count in the header when groups are selected", () => {
    render(
      wrap(
        <InviteeCombobox
          groups={GROUPS}
          members={MEMBERS}
          selectedGroupIds={new Set([1])}
          selectedMemberIds={new Set([100001])}
          onToggleGroup={vi.fn()}
          onToggleMember={vi.fn()}
        />,
      ),
    );
    expect(screen.getByText("2 invitees selected")).toBeInTheDocument();
  });

  it("calls onToggleGroup when a group item is clicked", () => {
    const onToggleGroup = vi.fn();
    render(
      wrap(
        <InviteeCombobox
          groups={GROUPS}
          members={MEMBERS}
          selectedGroupIds={new Set()}
          selectedMemberIds={new Set()}
          onToggleGroup={onToggleGroup}
          onToggleMember={vi.fn()}
        />,
      ),
    );
    fireEvent.click(screen.getByText("Add Group/Members"));
    fireEvent.click(screen.getByText("Board of Directors"));
    expect(onToggleGroup).toHaveBeenCalledWith(1);
  });
});
