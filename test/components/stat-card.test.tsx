import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/dashboard/stat-card";

describe("StatCard", () => {
  it("renders label and value text", () => {
    render(
      <StatCard
        label="Total Members"
        value="376/500"
        icon={<span data-testid="icon" />}
        viewAllHref="/referral-database"
      />,
    );
    expect(screen.getByText("Total Members")).toBeInTheDocument();
    expect(screen.getByText("376/500")).toBeInTheDocument();
  });

  it("renders the provided icon", () => {
    render(
      <StatCard
        label="Total Members"
        value="1/500"
        icon={<span data-testid="custom-icon">svg</span>}
        viewAllHref="/referral-database"
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders a View all link with the given href", () => {
    render(<StatCard label="Total Members" value="1/500" icon={<span />} viewAllHref="/referral-database" />);
    const link = screen.getByRole("link", { name: /View all/ });
    expect(link).toHaveAttribute("href", "/referral-database");
  });
});
