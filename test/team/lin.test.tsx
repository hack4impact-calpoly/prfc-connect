import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "@/app/team/lin/page";

describe("Lin Team Page", () => {
  it("renders name and role", () => {
    render(<Page />);
    expect(screen.getByText("Kyle Lin")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
  });

  it("renders fun fact section", () => {
    render(<Page />);
    expect(screen.getByText(/Fun Fact/)).toBeInTheDocument();
  });

  it("counter is incremented when button is clicked", async () => {
    render(<Page />);
    const button = screen.getByRole("button", { name: "Click Me!" });

    await userEvent.click(button);

    const count = Number(screen.getByTestId("count").textContent);

    expect(count).toEqual(1);
  });
});
