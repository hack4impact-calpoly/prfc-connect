import { vi } from "vitest";

vi.mock("@/services/email", () => ({
  validateEmailAllowed: vi.fn(),
  getDailyEmailCount: vi.fn().mockResolvedValue(0),
  sendReferralEmails: vi.fn().mockResolvedValue(undefined),
  sendGroupEmails: vi.fn().mockResolvedValue({ sent: 0, failed: 0, suppressed: 0, results: [] }),
}));

import { validateEmailAllowed, getDailyEmailCount, sendReferralEmails, sendGroupEmails } from "@/services/email";

export const mockValidateEmailAllowed = vi.mocked(validateEmailAllowed);
export const mockGetDailyEmailCount = vi.mocked(getDailyEmailCount);
export const mockSendReferralEmails = vi.mocked(sendReferralEmails);
export const mockSendGroupEmails = vi.mocked(sendGroupEmails);
