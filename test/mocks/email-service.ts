import { vi } from "vitest";

vi.mock("@/services/email", () => ({
  validateEmailAllowed: vi.fn(),
  getDailyEmailCount: vi.fn().mockResolvedValue(0),
  getRemainingEmailQuota: vi.fn().mockResolvedValue(300),
  sendReferralEmails: vi.fn().mockResolvedValue(undefined),
  sendGroupEmails: vi.fn().mockResolvedValue({ sent: 0, failed: 0, suppressed: 0, results: [] }),
}));

import {
  validateEmailAllowed,
  getDailyEmailCount,
  getRemainingEmailQuota,
  sendReferralEmails,
  sendGroupEmails,
} from "@/services/email";

export const mockValidateEmailAllowed = vi.mocked(validateEmailAllowed);
export const mockGetDailyEmailCount = vi.mocked(getDailyEmailCount);
export const mockGetRemainingEmailQuota = vi.mocked(getRemainingEmailQuota);
export const mockSendReferralEmails = vi.mocked(sendReferralEmails);
export const mockSendGroupEmails = vi.mocked(sendGroupEmails);
