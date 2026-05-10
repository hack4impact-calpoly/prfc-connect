import { vi } from "vitest";

vi.mock("@/lib/unsubscribe-tokens", () => ({
  generateUnsubscribeToken: vi
    .fn()
    .mockImplementation((memberId: number, groupId: number) => `mock-unsub-${memberId}-${groupId}`),
  generateEmailUnsubscribeToken: vi.fn().mockImplementation((email: string) => `mock-email-unsub-${email}`),
  verifyUnsubscribeToken: vi.fn(),
  verifyEmailUnsubscribeToken: vi.fn(),
}));

import {
  generateUnsubscribeToken,
  generateEmailUnsubscribeToken,
  verifyUnsubscribeToken,
  verifyEmailUnsubscribeToken,
} from "@/lib/unsubscribe-tokens";

export const mockGenerateUnsubscribeToken = vi.mocked(generateUnsubscribeToken);
export const mockGenerateEmailUnsubscribeToken = vi.mocked(generateEmailUnsubscribeToken);
export const mockVerifyUnsubscribeToken = vi.mocked(verifyUnsubscribeToken);
export const mockVerifyEmailUnsubscribeToken = vi.mocked(verifyEmailUnsubscribeToken);
