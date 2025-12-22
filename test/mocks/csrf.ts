import { vi } from "vitest";

const mockValidateOrigin = vi.fn().mockReturnValue(true);

vi.mock("@/lib/csrf", () => ({
  validateOrigin: mockValidateOrigin,
}));

beforeEach(() => {
  mockValidateOrigin.mockClear();
  mockValidateOrigin.mockReturnValue(true);
});

export { mockValidateOrigin };
