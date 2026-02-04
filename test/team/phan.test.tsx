import { render, screen } from "@testing-library/react";
import Page from "@/app/team/phan/page";
import userEvent from "@testing-library/user-event";

describe("Phan Team Page", () => {
  it("renders name", () => {
    render(<Page />);
    expect(screen.getByText("Sam Phan")).toBeInTheDocument();
  });

  it("renders role", () => {
    render(<Page />);
    expect(screen.getByText("Developer")).toBeInTheDocument();
  });

  it("renders fun fact", () => {
    render(<Page />);
    expect(screen.getByText("Fun Fact:")).toBeInTheDocument();
  });

  it("renders button", () => {
    render(<Page />);
    expect(screen.getByRole("button", { name: /0/ })).toBeInTheDocument();
  });

  it("increments button when clicked", async () => {
    render(<Page />);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: /0/ });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole("button", { name: /1/ })).toBeInTheDocument();
  });
});
