export interface UserPreferenceData {
  notifyEmailDefault: boolean;
  notifySmsDefault: boolean;
}

export interface MemberProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string | undefined;
  role: "Admin" | "Member";
}

export interface SmsConsentRecord {
  id: number;
  memberId: number;
  consentedAt: Date;
  consentMethod: string;
  consentText: string;
  consentPurpose: string;
  revokedAt: Date | null;
  revokeMethod: string | null;
}
