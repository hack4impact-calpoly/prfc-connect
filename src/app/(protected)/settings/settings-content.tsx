"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NotificationPreferencesCard } from "@/components/settings/notification-preferences-card";
import { updateUserPreferencesAction } from "@/actions/settings";
import type { UserPreferenceData } from "@/services/user-preference";
import type { SmsConsentRecord } from "@/services/sms-consent";

type Props = {
  preferences: UserPreferenceData;
  smsConsent: SmsConsentRecord | null;
  phone: string;
  smsFeatureEnabled: boolean;
};

export function SettingsContent({ preferences, smsConsent, phone, smsFeatureEnabled }: Props) {
  const [emailEnabled, setEmailEnabled] = useState(preferences.notifyEmailDefault);
  const [smsEnabled, setSmsEnabled] = useState(preferences.notifySmsDefault);

  const handleToggle = async (key: "notifyEmailDefault" | "notifySmsDefault", value: boolean) => {
    if (key === "notifyEmailDefault") setEmailEnabled(value);
    else setSmsEnabled(value);

    const result = await updateUserPreferencesAction({ [key]: value });
    if (result.success) {
      toast.success("Preferences updated");
    } else {
      if (key === "notifyEmailDefault") setEmailEnabled(!value);
      else setSmsEnabled(!value);
      toast.error(result.error ?? "Failed to update preferences");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-angkor text-3xl text-prfc-brown">Settings</h1>

      <div className="mt-6">
        <NotificationPreferencesCard
          emailEnabled={emailEnabled}
          smsEnabled={smsEnabled}
          smsFeatureEnabled={smsFeatureEnabled}
          smsConsentedAt={smsConsent?.consentedAt}
          phone={phone}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
