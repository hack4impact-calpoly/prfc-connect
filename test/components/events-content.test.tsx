import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/actions/event", () => ({
  fetchEventsForWeek: vi.fn().mockResolvedValue({ success: true, data: [] }),
  fetchEventsForMonth: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/components/events/week-calendar", () => ({
  WeekCalendar: () => <div data-testid="week-calendar-stub" />,
}));

vi.mock("@/components/events/month-calendar", () => ({
  MonthCalendar: () => <div data-testid="month-calendar-stub" />,
}));

vi.mock("@/components/events/create-event-popover", () => ({
  CreateEventPopover: () => <div data-testid="create-event-popover-stub" />,
}));

import { EventsContent } from "@/app/(protected)/events/events-content";

describe("EventsContent", () => {
  const defaultProps = {
    initialDateIso: new Date("2026-04-12T10:00:00").toISOString(),
    initialWeekEvents: [],
    groups: [],
    members: [],
    currentUserOwnerid: 100001,
    isAdmin: true,
  };

  it("renders the week heading and the WeekCalendar in week view", () => {
    render(<EventsContent {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("week-calendar-stub")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous week" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next week" })).toBeInTheDocument();
  });

  it("renders a Create Event button", () => {
    render(<EventsContent {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Create Event/ })).toBeInTheDocument();
  });

  it("exposes the View select combobox", () => {
    render(<EventsContent {...defaultProps} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
