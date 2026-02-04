import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import Page from "@/app/team/ma/page";

describe("Ma Team Page", () => {
  it("renders name", () => {
    render(<Page />);
    expect(screen.getByText("Ethan Ma")).toBeInTheDocument();
  });

  it("renders fun fact section and student's role", () => {
    render(<Page />);
    expect(screen.getByText(/Role: Devolper/i)).toBeInTheDocument();
    expect(screen.getByText(/I like snowboarding/i)).toBeInTheDocument();
  });

  it("increments counter when button is clicked", async () => {
    const user = userEvent.setup();
    render(<Page />);

    const button = screen.getByRole("button", { name: /button/i });
    const counter = screen.getByText(/Clicks: 0/i);

    expect(counter).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByText(/Clicks: 1/i)).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByText(/Clicks: 2/i)).toBeInTheDocument();
  });
});
