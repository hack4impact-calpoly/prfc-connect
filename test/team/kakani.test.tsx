import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "@/app/team/kakani/page";

describe("Kakani Team Page", () => {
  it("renders name on the page", () => {
    render(<Page />);
    expect(screen.getByText("Snehil Kakani")).toBeInTheDocument();
  });

  it("renders role on the page", () => {
    render(<Page />);
    expect(screen.getByText("Developer")).toBeInTheDocument();
  });

  it("renders the fun fact section", () => {
    render(<Page />);
    expect(screen.getByText("Interests")).toBeInTheDocument();
  });

  it("has a counter button", () => {
    render(<Page />);
    expect(screen.getByRole("button", { name: /count:/i })).toBeInTheDocument();
  });

  it("increments counter when button is clicked", async () => {
    const user = userEvent.setup();
    render(<Page />);

    const button = screen.getByRole("button", { name: /count: 0/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole("button", { name: /count: 1/i })).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole("button", { name: /count: 2/i })).toBeInTheDocument();
  });
});
