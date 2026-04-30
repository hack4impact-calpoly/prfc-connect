import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { NotificationPreferencesCard } from "@/components/settings/notification-preferences-card";

describe("NotificationPreferencesCard", () => {
  it("renders the Notifications heading and email toggle row", () => {
    render(<NotificationPreferencesCard emailEnabled smsEnabled={false} smsFeatureEnabled onToggle={vi.fn()} />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Receive event announcements and group messages via email")).toBeInTheDocument();
  });

  it("renders the SMS toggle row when smsFeatureEnabled is true", () => {
    render(<NotificationPreferencesCard emailEnabled smsEnabled={false} smsFeatureEnabled onToggle={vi.fn()} />);
    expect(screen.getByText("Receive event reminders and group messages via text")).toBeInTheDocument();
  });

  it("hides the SMS toggle row when smsFeatureEnabled is false", () => {
    render(
      <NotificationPreferencesCard emailEnabled smsEnabled={false} smsFeatureEnabled={false} onToggle={vi.fn()} />,
    );
    expect(screen.queryByText("Receive event reminders and group messages via text")).not.toBeInTheDocument();
  });

  it("fires onToggle with the flipped value when the email switch is clicked", () => {
    const onToggle = vi.fn();
    render(<NotificationPreferencesCard emailEnabled smsEnabled={false} smsFeatureEnabled onToggle={onToggle} />);
    const emailSwitch = screen.getByRole("switch", {
      name: "Receive event announcements and group messages via email",
    });
    fireEvent.click(emailSwitch);
    expect(onToggle).toHaveBeenCalledWith("notifyEmailDefault", false);
  });
});
