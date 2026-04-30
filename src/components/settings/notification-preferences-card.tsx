"use client";

import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type PreferenceKey = "notifyEmailDefault" | "notifySmsDefault";

type Props = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  smsFeatureEnabled: boolean;
  smsConsentedAt?: Date;
  phone?: string;
  onToggle: (key: PreferenceKey, value: boolean) => void;
};

export function NotificationPreferencesCard({
  emailEnabled,
  smsEnabled,
  smsFeatureEnabled,
  smsConsentedAt,
  phone,
  onToggle,
}: Props) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-prfc-brown" />
        <h3 className="font-semibold text-foreground">Notifications</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <label htmlFor="email-toggle" className="block font-medium text-foreground">
              Receive event announcements and group messages via email
            </label>
            <p className="text-sm text-muted-foreground">
              You can unsubscribe from any email using the link at the bottom of the message.
            </p>
          </div>
          <Switch
            id="email-toggle"
            checked={emailEnabled}
            onCheckedChange={(value) => onToggle("notifyEmailDefault", value)}
            className="data-[state=checked]:bg-prfc-red"
          />
        </div>
        {smsFeatureEnabled && (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <label htmlFor="sms-toggle" className="block font-medium text-foreground">
                  Receive event reminders and group messages via text
                </label>
                <p className="text-sm text-muted-foreground">
                  Up to 8 msgs/month. Msg & data rates may apply. Reply STOP to cancel.
                </p>
              </div>
              <Switch
                id="sms-toggle"
                checked={smsEnabled}
                onCheckedChange={(value) => onToggle("notifySmsDefault", value)}
                className="data-[state=checked]:bg-prfc-red"
              />
            </div>
            {smsEnabled && phone && (
              <div className="rounded-md bg-paso-grey px-4 py-3 text-sm text-muted-foreground">
                <p>SMS to {phone}</p>
                {smsConsentedAt && (
                  <p>
                    Consented on{" "}
                    {new Date(smsConsentedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
