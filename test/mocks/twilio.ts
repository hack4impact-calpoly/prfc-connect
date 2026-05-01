import { vi } from "vitest";

export const mockTwilioSend = vi.fn();

vi.mock("twilio", () => {
  return {
    default: () => ({
      messages: {
        create: mockTwilioSend,
      },
    }),
  };
});
