const mockLimit = jest.fn().mockResolvedValue({
  success: true,
  remaining: 4,
  reset: Date.now() + 60000,
});

jest.mock("@/lib/rate-limit", () => ({
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
