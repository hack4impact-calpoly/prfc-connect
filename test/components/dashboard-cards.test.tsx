import { render, screen } from "@testing-library/react";
import { TotalMembersCard } from "@/components/dashboard/total-members-card";
import { EventsThisMonthCard } from "@/components/dashboard/events-this-month-card";

describe("TotalMembersCard", () => {
  it("renders the count formatted as fraction of 500", () => {
    render(<TotalMembersCard count={376} />);
    expect(screen.getByText("376/500")).toBeInTheDocument();
    expect(screen.getByText("Total Members")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View all/ })).not.toBeInTheDocument();
  });

  it("renders the empty state as 0/500", () => {
    render(<TotalMembersCard count={0} />);
    expect(screen.getByText("0/500")).toBeInTheDocument();
  });
});

describe("EventsThisMonthCard", () => {
  it("renders the count as a plain number", () => {
    render(<EventsThisMonthCard count={30} />);
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Events This Month")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all/ })).toHaveAttribute("href", "/events");
  });

  it("renders the empty state as 0", () => {
    render(<EventsThisMonthCard count={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
