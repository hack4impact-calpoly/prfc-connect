"use client";

import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type PreferenceKey = "notifyEmailDefault" | "notifySmsDefault";

type Props = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  smsFeatureEnabled: boolean;
  onToggle: (key: PreferenceKey, value: boolean) => void;
};

export function NotificationPreferencesCard({ emailEnabled, smsEnabled, smsFeatureEnabled, onToggle }: Props) {
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
              Always send email notifications
            </label>
            <p className="text-sm text-muted-foreground">Receive emails sample text</p>
          </div>
          <Switch
            id="email-toggle"
            checked={emailEnabled}
            onCheckedChange={(value) => onToggle("notifyEmailDefault", value)}
            className="data-[state=checked]:bg-prfc-red"
          />
        </div>
        {smsFeatureEnabled && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <label htmlFor="sms-toggle" className="block font-medium text-foreground">
                Always send text notifications
              </label>
              <p className="text-sm text-muted-foreground">Receive texts sample text</p>
            </div>
            <Switch
              id="sms-toggle"
              checked={smsEnabled}
              onCheckedChange={(value) => onToggle("notifySmsDefault", value)}
              className="data-[state=checked]:bg-prfc-red"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
