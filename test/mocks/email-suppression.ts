import { vi } from "vitest";

vi.mock("@/services/email-suppression", () => ({
  isEmailSuppressed: vi.fn().mockResolvedValue(false),
  filterSuppressedEmails: vi
    .fn()
    .mockImplementation((emails: string[]) => Promise.resolve({ valid: emails, suppressed: [] })),
  suppressEmail: vi.fn().mockResolvedValue(undefined),
}));

import { isEmailSuppressed, filterSuppressedEmails, suppressEmail } from "@/services/email-suppression";

export const mockIsEmailSuppressed = vi.mocked(isEmailSuppressed);
export const mockFilterSuppressedEmails = vi.mocked(filterSuppressedEmails);
export const mockSuppressEmail = vi.mocked(suppressEmail);
