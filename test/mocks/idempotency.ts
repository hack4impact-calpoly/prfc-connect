import { vi } from "vitest";

const mockGetIdempotentResponse = vi.fn().mockResolvedValue(null);
const mockSetIdempotentResponse = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/idempotency", () => ({
  getIdempotentResponse: mockGetIdempotentResponse,
  setIdempotentResponse: mockSetIdempotentResponse,
}));

beforeEach(() => {
  mockGetIdempotentResponse.mockClear();
  mockSetIdempotentResponse.mockClear();
  mockGetIdempotentResponse.mockResolvedValue(null);
});

export { mockGetIdempotentResponse, mockSetIdempotentResponse };
