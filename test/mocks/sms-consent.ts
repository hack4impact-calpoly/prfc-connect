import type { SmsConsentRecord } from "@/services/sms-consent";

export const activeConsentKermit: SmsConsentRecord = {
  id: 1,
  memberId: 100001,
  consentedAt: new Date("2026-01-15T10:00:00Z"),
  consentMethod: "web_form",
  consentText: "I agree to receive SMS messages from PRFC Connect",
  consentPurpose: "group_notifications",
  revokedAt: null,
  revokeMethod: null,
};
