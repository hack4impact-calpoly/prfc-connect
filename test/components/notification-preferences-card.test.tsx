import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { NotificationPreferencesCard } from "@/components/settings/notification-preferences-card";

describe("NotificationPreferencesCard", () => {
  it("renders the Notifications heading and email toggle row", () => {
    render(<NotificationPreferencesCard emailEnabled smsEnabled={false} smsFeatureEnabled onToggle={vi.fn()} />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Always send email notifications")).toBeInTheDocument();
  });

  it("renders the SMS toggle row when smsFeatureEnabled is true", () => {
    render(<NotificationPreferencesCard emailEnabled smsEnabled={false} smsFeatureEnabled onToggle={vi.fn()} />);
    expect(screen.getByText("Always send text notifications")).toBeInTheDocument();
  });

  it("hides the SMS toggle row when smsFeatureEnabled is false", () => {
    render(
      <NotificationPreferencesCard emailEnabled smsEnabled={false} smsFeatureEnabled={false} onToggle={vi.fn()} />,
    );
    expect(screen.queryByText("Always send text notifications")).not.toBeInTheDocument();
  });

  it("fires onToggle with the flipped value when the email switch is clicked", () => {
    const onToggle = vi.fn();
    render(<NotificationPreferencesCard emailEnabled smsEnabled={false} smsFeatureEnabled onToggle={onToggle} />);
    const emailSwitch = screen.getByRole("switch", { name: "Always send email notifications" });
    fireEvent.click(emailSwitch);
    expect(onToggle).toHaveBeenCalledWith("notifyEmailDefault", false);
  });
});
