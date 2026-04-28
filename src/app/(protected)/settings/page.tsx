import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { getUserPreferences } from "@/services/user-preference";
import { getMemberSmsConsent } from "@/services/sms-consent";
import { getMemberProfile } from "@/services/profile";
import { env } from "@/env";
import { SettingsContent } from "./settings-content";

export const metadata: Metadata = {
  title: "Settings | PRFC Connect",
};

export default async function SettingsPage() {
  const session = await verifySession();
  const [preferences, smsConsent, profile] = await Promise.all([
    getUserPreferences(session.ownerid),
    env.SMS_ENABLED ? getMemberSmsConsent(session.ownerid) : null,
    getMemberProfile(session.ownerid, session.isAdmin),
  ]);

  return (
    <SettingsContent
      preferences={preferences}
      smsConsent={smsConsent}
      phone={profile.phone}
      smsFeatureEnabled={env.SMS_ENABLED}
    />
  );
}
