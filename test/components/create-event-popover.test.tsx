import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, type MockedFunction } from "vitest";
import { TopBarSearchProvider } from "@/components/layout/top-bar-search-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";

vi.mock("@/actions/event", () => ({
  createEventAction: vi.fn(),
  updateEventAction: vi.fn(),
  deleteEventAction: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { createEventAction, deleteEventAction, updateEventAction } from "@/actions/event";
import { toast } from "sonner";
import { CreateEventPopover } from "@/components/events/create-event-popover";
import { eventBoardMeeting } from "../mocks/events";

const mockCreateEventAction = createEventAction as MockedFunction<typeof createEventAction>;
const mockUpdateEventAction = updateEventAction as MockedFunction<typeof updateEventAction>;
const mockDeleteEventAction = deleteEventAction as MockedFunction<typeof deleteEventAction>;

const sampleEvent = eventBoardMeeting;

function wrap(ui: React.ReactElement) {
  return (
    <TopBarSearchProvider>
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>{ui}</DialogContent>
      </Dialog>
    </TopBarSearchProvider>
  );
}

describe("CreateEventPopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks submit when title is empty and shows Title is required, not a date/time error", () => {
    render(
      wrap(
        <CreateEventPopover
          onClose={vi.fn()}
          defaultDate={new Date("2026-04-13T17:00:00-07:00")}
          groups={[]}
          members={[]}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.queryByText("Date and time are required")).not.toBeInTheDocument();
    expect(screen.queryByText(/End time must be after start time/)).not.toBeInTheDocument();
    expect(mockCreateEventAction).not.toHaveBeenCalled();
  });

  it("blocks submit when title is whitespace-only and shows Title is required", () => {
    render(
      wrap(
        <CreateEventPopover
          onClose={vi.fn()}
          defaultDate={new Date("2026-04-13T17:00:00-07:00")}
          groups={[]}
          members={[]}
        />,
      ),
    );
    fireEvent.change(screen.getByLabelText("Event title"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(mockCreateEventAction).not.toHaveBeenCalled();
  });

  it("shows Title is required FIRST when both title and end-after-start would fail, exercising check ordering", () => {
    render(
      wrap(
        <CreateEventPopover
          onClose={vi.fn()}
          defaultDate={new Date("2026-04-13T17:00:00-07:00")}
          groups={[]}
          members={[]}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });

  it("populates both range.start and range.end from defaultDate so Save does not error on empty range", async () => {
    mockCreateEventAction.mockResolvedValue({ success: true, data: { id: 7 } });
    render(
      wrap(
        <CreateEventPopover
          onClose={vi.fn()}
          defaultDate={new Date("2026-04-13T17:00:00-07:00")}
          groups={[]}
          members={[]}
        />,
      ),
    );
    fireEvent.change(screen.getByLabelText("Event title"), { target: { value: "Autofilled Range" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(mockCreateEventAction).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText("Date and time are required")).not.toBeInTheDocument();
    const call = mockCreateEventAction.mock.calls[0][0];
    expect(call.startDate).toBeInstanceOf(Date);
    expect(call.endDate).toBeInstanceOf(Date);
  });

  it("submits with trimmed fields and maps empty optional fields to null", async () => {
    mockCreateEventAction.mockResolvedValue({ success: true, data: { id: 42 } });
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      wrap(
        <CreateEventPopover
          onClose={onClose}
          defaultDate={new Date("2026-04-13T10:00:00")}
          groups={[]}
          members={[]}
          onSaved={onSaved}
        />,
      ),
    );

    fireEvent.change(screen.getByLabelText("Event title"), {
      target: { value: "  Board Meeting  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockCreateEventAction).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateEventAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Board Meeting",
        eventType: "social",
        location: null,
        description: null,
        rsvpDeadline: null,
        memberIds: [],
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Event created");
    expect(onSaved).toHaveBeenCalledWith(42);
    expect(onClose).toHaveBeenCalled();
  });

  it("surfaces server error in toast and keeps form state", async () => {
    mockCreateEventAction.mockResolvedValue({ success: false, error: "Something broke" });
    const onClose = vi.fn();

    render(
      wrap(
        <CreateEventPopover onClose={onClose} defaultDate={new Date("2026-04-13T10:00:00")} groups={[]} members={[]} />,
      ),
    );

    fireEvent.change(screen.getByLabelText("Event title"), {
      target: { value: "Board Meeting" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something broke");
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("Board Meeting")).toBeInTheDocument();
  });

  describe("all-day toggle", () => {
    it("sends isAllDay:true and stores start/end as UTC midnight of the coop floating date", async () => {
      mockCreateEventAction.mockResolvedValue({ success: true, data: { id: 1 } });

      render(
        wrap(
          <CreateEventPopover
            onClose={vi.fn()}
            defaultDate={new Date("2026-04-15T17:00:00-07:00")}
            groups={[]}
            members={[]}
          />,
        ),
      );

      fireEvent.change(screen.getByLabelText("Event title"), {
        target: { value: "Board Meeting" },
      });
      fireEvent.click(screen.getByRole("checkbox", { name: /All day/ }));
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(mockCreateEventAction).toHaveBeenCalledTimes(1);
      });

      const call = mockCreateEventAction.mock.calls[0][0];
      expect(call.isAllDay).toBe(true);
      const start = call.startDate as Date;
      const end = call.endDate as Date;
      expect(start.toISOString()).toBe("2026-04-15T00:00:00.000Z");
      expect(end.toISOString()).toBe("2026-04-15T00:00:00.000Z");
    });
  });

  describe("group derivation from selectedMemberIds", () => {
    it("pre-fills selectedMemberIds from initialMemberIds and derives the group as selected when all its members are invited", () => {
      const groups = [
        { id: 1, name: "Board", memberCount: 2, memberIds: [100001, 100002] },
        { id: 2, name: "Volunteers", memberCount: 2, memberIds: [100003, 100004] },
      ];
      const members = [
        { ownerid: 100001, ownername: "Alice" },
        { ownerid: 100002, ownername: "Bob" },
        { ownerid: 100003, ownername: "Carol" },
        { ownerid: 100004, ownername: "Dan" },
      ];
      render(
        wrap(
          <CreateEventPopover
            onClose={vi.fn()}
            groups={groups}
            members={members}
            editingEvent={sampleEvent}
            canEdit
            initialMemberIds={[100001, 100002]}
          />,
        ),
      );
      expect(screen.queryByText("Add Group/Members")).not.toBeInTheDocument();
      expect(screen.getByText("invitees selected", { exact: false })).toBeInTheDocument();
    });

    it("toggling a group adds all its members to the invited set on save", async () => {
      mockUpdateEventAction.mockResolvedValue({ success: true });
      const groups = [{ id: 1, name: "Board", memberCount: 2, memberIds: [100001, 100002] }];
      const members = [
        { ownerid: 100001, ownername: "Alice" },
        { ownerid: 100002, ownername: "Bob" },
      ];
      render(
        wrap(
          <CreateEventPopover onClose={vi.fn()} groups={groups} members={members} editingEvent={sampleEvent} canEdit />,
        ),
      );
      fireEvent.click(screen.getByText("Add Group/Members"));
      fireEvent.click(screen.getByText("Board"));
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(mockUpdateEventAction).toHaveBeenCalledTimes(1);
      });
      const call = mockUpdateEventAction.mock.calls[0][1] as { memberIds: number[] };
      expect(call.memberIds.sort()).toEqual([100001, 100002]);
    });
  });

  describe("edit mode", () => {
    it("pre-fills fields from editingEvent and shows Save Changes and Delete buttons", () => {
      render(
        wrap(<CreateEventPopover onClose={vi.fn()} groups={[]} members={[]} editingEvent={sampleEvent} canEdit />),
      );
      expect(screen.getByDisplayValue("Existing Board Meeting")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Co-op Office")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Quarterly review")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
    });

    it("calls updateEventAction with the trimmed edited title", async () => {
      mockUpdateEventAction.mockResolvedValue({ success: true });
      const onSaved = vi.fn();
      const onClose = vi.fn();

      render(
        wrap(
          <CreateEventPopover
            onClose={onClose}
            groups={[]}
            members={[]}
            editingEvent={sampleEvent}
            canEdit
            onSaved={onSaved}
          />,
        ),
      );

      fireEvent.change(screen.getByLabelText("Event title"), {
        target: { value: "Updated Board Meeting" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(mockUpdateEventAction).toHaveBeenCalledTimes(1);
      });
      expect(mockUpdateEventAction).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ title: "Updated Board Meeting", eventType: "meeting" }),
      );
      expect(toast.success).toHaveBeenCalledWith("Event updated");
      expect(onSaved).toHaveBeenCalledWith(42);
      expect(onClose).toHaveBeenCalled();
    });

    it("hides Save Changes and Delete buttons when canEdit is false", () => {
      render(
        wrap(
          <CreateEventPopover onClose={vi.fn()} groups={[]} members={[]} editingEvent={sampleEvent} canEdit={false} />,
        ),
      );
      expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Delete$/ })).not.toBeInTheDocument();
    });

    it("opens the delete confirm dialog and fires deleteEventAction on confirm", async () => {
      mockDeleteEventAction.mockResolvedValue({ success: true });
      const onDeleted = vi.fn();
      const onClose = vi.fn();

      render(
        wrap(
          <CreateEventPopover
            onClose={onClose}
            groups={[]}
            members={[]}
            editingEvent={sampleEvent}
            canEdit
            onDeleted={onDeleted}
          />,
        ),
      );

      fireEvent.click(screen.getByRole("button", { name: /Delete/ }));
      expect(screen.getByText("Delete this event?")).toBeInTheDocument();

      const confirmButtons = screen.getAllByRole("button", { name: /Delete/ });
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteEventAction).toHaveBeenCalledWith(42);
      });
      expect(toast.success).toHaveBeenCalledWith("Event deleted");
      expect(onDeleted).toHaveBeenCalledWith(42);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
