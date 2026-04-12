import { render, screen } from "@testing-library/react";
import Page from "@/app/team/rutledge/page";

describe("Rutledge Team Page", () => {
  it("renders name and role", () => {
    render(<Page />);
    expect(screen.getByText("Kevin Rutledge")).toBeInTheDocument();
    expect(screen.getByText("Tech Lead")).toBeInTheDocument();
  });

  it("renders the notification preferences preview heading", () => {
    render(<Page />);
    expect(screen.getByText("Notification Preferences Card Preview")).toBeInTheDocument();
  });
});
