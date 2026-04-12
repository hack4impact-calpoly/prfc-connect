import { render } from "@testing-library/react";
import { WeekCalendar } from "@/components/week-calendar";

it("renders without crashing", () => {
  render(<WeekCalendar events={[]} />);
});
