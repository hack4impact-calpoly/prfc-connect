"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NotificationPreferencesCard } from "@/components/settings/notification-preferences-card";
import { SmsConsentCard } from "@/components/settings/sms-consent-card";
import { updateUserPreferencesAction, revokeSmsConsentAction } from "@/actions/settings";
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
  const [hasConsent, setHasConsent] = useState(!!smsConsent);
  const [isRevoking, setIsRevoking] = useState(false);

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

  const handleRevoke = async () => {
    setIsRevoking(true);
    const result = await revokeSmsConsentAction({ method: "web_settings", message: null });
    setIsRevoking(false);
    if (result.success) {
      setHasConsent(false);
      toast.success("SMS consent revoked");
    } else {
      toast.error(result.error ?? "Failed to revoke consent");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-angkor text-3xl text-prfc-brown">Settings</h1>

      <div className="mt-6 space-y-6">
        <NotificationPreferencesCard
          emailEnabled={emailEnabled}
          smsEnabled={smsEnabled}
          smsFeatureEnabled={smsFeatureEnabled}
          onToggle={handleToggle}
        />

        {smsFeatureEnabled && (
          <SmsConsentCard phone={phone} hasConsent={hasConsent} onRevoke={handleRevoke} isRevoking={isRevoking} />
        )}
      </div>
    </div>
  );
}
