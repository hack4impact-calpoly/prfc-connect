import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UnsubscribeForm } from "@/app/(public)/unsubscribe/unsubscribe-form";

describe("UnsubscribeForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a missing-token message when no token is provided", () => {
    render(<UnsubscribeForm token="" />);
    expect(screen.getByText(/missing its token/i)).toBeInTheDocument();
  });

  it("posts to the unsubscribe API and shows success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 204, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(<UnsubscribeForm token="tok123" />);
    fireEvent.click(screen.getByRole("button", { name: "Unsubscribe" }));

    await waitFor(() => expect(screen.getByText(/You have been unsubscribed/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/unsubscribe?token=tok123", { method: "POST" });
  });

  it("shows an error message when the API rejects the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 400, json: async () => ({ error: "Invalid signature" }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<UnsubscribeForm token="bad" />);
    fireEvent.click(screen.getByRole("button", { name: "Unsubscribe" }));

    await waitFor(() => expect(screen.getByText("Invalid signature")).toBeInTheDocument());
  });
});
