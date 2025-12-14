jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "mock-msg-7f3a9b2c" }),
  }),
}));

import nodemailer from "nodemailer";

beforeEach(() => {
  jest.clearAllMocks();
});

export const emailTransportMock = nodemailer.createTransport() as jest.Mocked<
  ReturnType<typeof nodemailer.createTransport>
>;
