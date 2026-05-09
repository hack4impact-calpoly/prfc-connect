import { vi, type Mock } from "vitest";

const mockSendBrevo = vi.fn().mockResolvedValue("mock-msg-7f3a9b2c");

vi.mock("@/lib/brevo", () => ({
  sendBrevoEmail: mockSendBrevo,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

export const mockBrevoSend: Mock = mockSendBrevo;
