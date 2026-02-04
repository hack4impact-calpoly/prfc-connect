import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Page from "@/app/team/suman/page";

describe("SumanPage", () => {
  it("renders the initial page content correctly", () => {
    render(<Page />);

    expect(screen.getByText("Saurish Suman")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(
      screen.getByText("I am working on a game engine that uses geometric algebra, rather than linear algebra."),
    ).toBeInTheDocument();

    expect(screen.getByText("Counter: 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Click Me!" })).toBeInTheDocument();
  });

  it("increments the counter when the button is clicked", () => {
    render(<Page />);

    const button = screen.getByRole("button", { name: "Click Me!" });

    fireEvent.click(button);
    expect(screen.getByText("Counter: 1")).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText("Counter: 2")).toBeInTheDocument();
  });
});
