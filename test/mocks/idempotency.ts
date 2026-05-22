import { vi } from "vitest";

const mockClaimIdempotencyKey = vi.fn().mockResolvedValue({ claimed: true });
const mockSetIdempotentResponse = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/idempotency", () => ({
  claimIdempotencyKey: mockClaimIdempotencyKey,
  setIdempotentResponse: mockSetIdempotentResponse,
}));

beforeEach(() => {
  mockClaimIdempotencyKey.mockClear();
  mockSetIdempotentResponse.mockClear();
  mockClaimIdempotencyKey.mockResolvedValue({ claimed: true });
});

export { mockClaimIdempotencyKey, mockSetIdempotentResponse };
