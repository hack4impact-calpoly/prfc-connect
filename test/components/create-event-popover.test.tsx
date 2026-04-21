import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, type MockedFunction } from "vitest";
import { TopBarSearchProvider } from "@/components/layout/top-bar-search-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";

vi.mock("@/actions/event", () => ({
  createEventAction: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { createEventAction } from "@/actions/event";
import { toast } from "sonner";
import { CreateEventPopover } from "@/components/events/create-event-popover";

const mockCreateEventAction = createEventAction as MockedFunction<typeof createEventAction>;

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

  it("blocks submit when title is empty", () => {
    render(
      wrap(
        <CreateEventPopover onClose={vi.fn()} defaultDate={new Date("2026-04-13T10:00:00")} groups={[]} members={[]} />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(mockCreateEventAction).not.toHaveBeenCalled();
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
        groupIds: [],
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
});
