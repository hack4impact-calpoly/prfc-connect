import { vi } from "vitest";
import { mockTwilioSend } from "../mocks/twilio";

vi.mock("@/env", () => ({
  env: {
    SMS_ENABLED: true,
    TWILIO_ACCOUNT_SID: "ACtest",
    TWILIO_AUTH_TOKEN: "testtoken",
    TWILIO_FROM_NUMBER: "+15551234567",
  },
}));

import { sendGroupSms, validateSmsAllowed } from "@/services/sms";

describe("validateSmsAllowed", () => {
  it("passes when SMS_ENABLED is true and credentials are set", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T18:00:00Z"));

    expect(() => validateSmsAllowed()).not.toThrow();

    vi.useRealTimers();
  });

  it("throws during quiet hours", () => {
    vi.useFakeTimers();
    // 06:00 UTC on Jan 15 is 22:00 Pacific (PST) the prior evening, inside quiet hours
    vi.setSystemTime(new Date("2026-01-15T06:00:00Z"));

    expect(() => validateSmsAllowed()).toThrow(/quiet hours/i);

    vi.useRealTimers();
  });
});

describe("sendGroupSms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends SMS to all recipients and returns per-recipient results", async () => {
    mockTwilioSend.mockResolvedValueOnce({ sid: "SM001" }).mockResolvedValueOnce({ sid: "SM002" });

    const result = await sendGroupSms({
      recipients: [
        { memberId: 100001, phone: "+15551111111" },
        { memberId: 100002, phone: "+15552222222" },
      ],
      body: "Test message",
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toEqual({ memberId: 100001, status: "sent", externalId: "SM001" });
    expect(result.results[1]).toEqual({ memberId: 100002, status: "sent", externalId: "SM002" });
  });

  it("handles partial failures with per-recipient error tracking", async () => {
    mockTwilioSend.mockResolvedValueOnce({ sid: "SM001" }).mockRejectedValueOnce(new Error("Unverified number"));

    const result = await sendGroupSms({
      recipients: [
        { memberId: 100001, phone: "+15551111111" },
        { memberId: 100002, phone: "+15552222222" },
      ],
      body: "Test message",
    });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results[0].status).toBe("sent");
    expect(result.results[1].status).toBe("failed");
    expect(result.results[1].error).toBe("Unverified number");
  });

  it("returns empty results for empty recipient list", async () => {
    const result = await sendGroupSms({ recipients: [], body: "Test" });

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.results).toEqual([]);
    expect(mockTwilioSend).not.toHaveBeenCalled();
  });

  it("captures Twilio SID as externalId", async () => {
    mockTwilioSend.mockResolvedValueOnce({ sid: "SM_test_sid_123" });

    const result = await sendGroupSms({
      recipients: [{ memberId: 100001, phone: "+15551111111" }],
      body: "Test",
    });

    expect(result.results[0].externalId).toBe("SM_test_sid_123");
  });

  it("appends STOP opt-out footer to every SMS", async () => {
    mockTwilioSend.mockResolvedValueOnce({ sid: "SM001" });

    await sendGroupSms({
      recipients: [{ memberId: 100001, phone: "+15551111111" }],
      body: "Event tomorrow at 3 PM",
    });

    const sentBody = mockTwilioSend.mock.calls[0][0].body;
    expect(sentBody).toContain("Event tomorrow at 3 PM");
    expect(sentBody).toContain("Reply STOP to opt out");
    expect(sentBody).toContain("Msg & data rates may apply");
  });
});
