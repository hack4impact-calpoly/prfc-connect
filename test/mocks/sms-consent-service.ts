import { vi } from "vitest";

vi.mock("@/services/sms-consent", () => ({
  getMemberSmsConsent: vi.fn(),
  grantSmsConsent: vi.fn(),
  hasActiveConsent: vi.fn(),
  revokeSmsConsent: vi.fn(),
  revokeConsentByPhone: vi.fn(),
  getConsentedPhones: vi.fn(),
}));

import {
  getMemberSmsConsent,
  grantSmsConsent,
  hasActiveConsent,
  revokeSmsConsent,
  revokeConsentByPhone,
  getConsentedPhones,
} from "@/services/sms-consent";

export const mockGetMemberSmsConsent = vi.mocked(getMemberSmsConsent);
export const mockGrantSmsConsent = vi.mocked(grantSmsConsent);
export const mockHasActiveConsent = vi.mocked(hasActiveConsent);
export const mockRevokeSmsConsent = vi.mocked(revokeSmsConsent);
export const mockRevokeConsentByPhone = vi.mocked(revokeConsentByPhone);
export const mockGetConsentedPhones = vi.mocked(getConsentedPhones);
