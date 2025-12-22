import { vi } from "vitest";

const mockLimit = vi.fn().mockResolvedValue({
  success: true,
  remaining: 4,
  reset: Date.now() + 60000,
});

vi.mock("@/lib/rate-limit", () => ({
  rateLimiter: {
    limit: mockLimit,
  },
}));

beforeEach(() => {
  mockLimit.mockClear();
  mockLimit.mockResolvedValue({
    success: true,
    remaining: 4,
    reset: Date.now() + 60000,
  });
});

export { mockLimit as rateLimiterMock };
