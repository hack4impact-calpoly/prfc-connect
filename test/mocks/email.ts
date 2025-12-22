import { vi, type Mocked } from "vitest";

vi.mock("nodemailer", () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: "mock-msg-7f3a9b2c" });
  const mockCreateTransport = vi.fn().mockReturnValue({
    sendMail: mockSendMail,
  });
  return {
    default: {
      createTransport: mockCreateTransport,
    },
    createTransport: mockCreateTransport,
  };
});

import nodemailer from "nodemailer";

beforeEach(() => {
  vi.clearAllMocks();
});

export const emailTransportMock = nodemailer.createTransport() as Mocked<ReturnType<typeof nodemailer.createTransport>>;
