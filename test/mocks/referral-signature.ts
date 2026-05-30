import { vi } from "vitest";

const mockVerifyReferralSignature = vi.fn();

vi.mock("@/lib/referral-signature", () => ({
  verifyReferralSignature: mockVerifyReferralSignature,
}));

beforeEach(() => {
  mockVerifyReferralSignature.mockReset();
  mockVerifyReferralSignature.mockReturnValue(true);
});

export { mockVerifyReferralSignature };
