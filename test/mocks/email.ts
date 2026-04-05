import { vi, type Mock } from "vitest";

const mockSend = vi.fn().mockResolvedValue({ data: { id: "mock-msg-7f3a9b2c" }, error: null });

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

export const mockResendSend: Mock = mockSend;
