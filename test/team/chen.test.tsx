import { render, screen } from "@testing-library/react";
import Page from "@/app/team/chen/page";

describe("Chen Team Page", () => {
  it("renders name and role", () => {
    render(<Page />);
    expect(screen.getByText("Karson Chen")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
  });

  it("renders fun fact section", () => {
    render(<Page />);
    expect(screen.getByText("Fun Fact")).toBeInTheDocument();
  });
});
