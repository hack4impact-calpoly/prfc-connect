const mockGetIdempotentResponse = jest.fn().mockResolvedValue(null);
const mockSetIdempotentResponse = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/idempotency", () => ({
  getIdempotentResponse: mockGetIdempotentResponse,
  setIdempotentResponse: mockSetIdempotentResponse,
}));

beforeEach(() => {
  mockGetIdempotentResponse.mockClear();
  mockSetIdempotentResponse.mockClear();
  mockGetIdempotentResponse.mockResolvedValue(null);
});

export { mockGetIdempotentResponse, mockSetIdempotentResponse };
