import { render } from "@testing-library/react";
import { MonthCalendar } from "@/components/events/month-calendar";

it("renders without crashing", () => {
  render(<MonthCalendar currentMonth={new Date("2026-04-01")} onMonthChange={() => {}} eventDates={new Set()} />);
});
