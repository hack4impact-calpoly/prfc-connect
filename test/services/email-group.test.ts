import "../mocks/email";
import "../mocks/email-suppression";
import "../mocks/unsubscribe-tokens";

import { mockBrevoSend } from "../mocks/email";
import { mockFilterSuppressedEmails } from "../mocks/email-suppression";
import { mockGenerateEmailUnsubscribeToken } from "../mocks/unsubscribe-tokens";
import { sendGroupEmails } from "@/services/email";
import {
  recipientBobby,
  recipientLucy,
  recipientMarcie,
  recipientCharlie,
  recipientSnoopy,
  allRecipients,
} from "../mocks/email-group";

const defaultParams = {
  subject: "Test Subject",
  body: "<p>Test Body</p>",
  senderName: "Test Sender",
  replyTo: "reply@test.com",
};

describe("sendGroupEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrevoSend.mockResolvedValue("mock-id");
  });

  it("sends to all valid recipients", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockFilterSuppressedEmails).toHaveBeenCalledWith(recipients.map((r) => r.email));
    expect(mockBrevoSend).toHaveBeenCalledTimes(3);
  });

  it("filters out suppressed emails before sending", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: [recipientBobby.email],
      suppressed: [recipientLucy.email, recipientMarcie.email],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockFilterSuppressedEmails).toHaveBeenCalledWith(recipients.map((r) => r.email));
    expect(mockBrevoSend).toHaveBeenCalledTimes(1);
  });

  it("generates unique unsubscribe token per recipient", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    const tokens = mockBrevoSend.mock.calls.map((call: unknown[]) => {
      const fields = call[0] as { headers: Record<string, string> };
      const raw = fields.headers["List-Unsubscribe"];
      const urlStr = raw.slice(1, -1);
      return new URL(urlStr).searchParams.get("token");
    });
    tokens.forEach((token: string | null) => expect(token).toBeTruthy());
    expect(new Set(tokens).size).toBe(tokens.length);
    expect(mockGenerateEmailUnsubscribeToken).toHaveBeenCalledTimes(3);
    expect(mockGenerateEmailUnsubscribeToken).toHaveBeenCalledWith(recipientBobby.email);
    expect(mockGenerateEmailUnsubscribeToken).toHaveBeenCalledWith(recipientLucy.email);
    expect(mockGenerateEmailUnsubscribeToken).toHaveBeenCalledWith(recipientMarcie.email);
  });

  it("includes RFC 8058 one-click unsubscribe headers", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    for (const [fields] of mockBrevoSend.mock.calls) {
      expect(fields.headers).toEqual(
        expect.objectContaining({
          "List-Unsubscribe": expect.stringMatching(/^<https?:\/\/.*\/api\/unsubscribe\?token=.+>$/),
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }),
      );
    }
  });

  it("appends CAN-SPAM footer with physical address", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockBrevoSend).toHaveBeenCalledTimes(3);
    for (const [fields] of mockBrevoSend.mock.calls) {
      const html = String(fields.htmlContent ?? "");
      expect(html).toContain("Paso Robles Food Cooperative, Inc.");
      expect(html).toContain("P.O. Box 922, Paso Robles, CA 93447");
      expect(html).toMatch(/<a href="[^"]*\/api\/unsubscribe\?token=[^"]*"[^>]*>Unsubscribe<\/a>/);
    }
  });

  describe("batching", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("sends in batches of 10 with delay between batches", async () => {
      const batchDelayMs = 1000;
      mockFilterSuppressedEmails.mockResolvedValue({
        valid: allRecipients.map((r) => r.email),
        suppressed: [],
      });

      const promise = sendGroupEmails({ ...defaultParams, recipients: allRecipients });

      await vi.advanceTimersByTimeAsync(0);
      expect(mockBrevoSend).toHaveBeenCalledTimes(10);

      await vi.advanceTimersByTimeAsync(batchDelayMs - 1);
      await Promise.resolve();
      expect(mockBrevoSend).toHaveBeenCalledTimes(10);

      await vi.advanceTimersByTimeAsync(1);
      await Promise.resolve();
      expect(mockBrevoSend).toHaveBeenCalledTimes(12);

      const { sent, failed, suppressed } = await promise;
      expect(sent).toBe(12);
      expect(failed).toBe(0);
      expect(suppressed).toBe(0);
    });
  });

  it("returns correct send/fail counts", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie, recipientCharlie, recipientSnoopy];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });
    mockBrevoSend
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("2")
      .mockResolvedValueOnce("3")
      .mockRejectedValueOnce(new Error("Send failure"))
      .mockResolvedValueOnce("5");

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockBrevoSend).toHaveBeenCalledTimes(5);
    expect(sent).toBe(4);
    expect(failed).toBe(1);
    expect(suppressed).toBe(0);
  });

  it("handles send errors gracefully without throwing", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });
    mockBrevoSend.mockRejectedValueOnce(new Error("API Error")).mockResolvedValue("ok");

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockBrevoSend).toHaveBeenCalledTimes(3);
    expect(sent).toBe(2);
    expect(failed).toBe(1);
    expect(suppressed).toBe(0);
  });

  it("returns zeros with empty recipient list", async () => {
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: [],
      suppressed: [],
    });

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients: [] });

    expect(mockFilterSuppressedEmails).toHaveBeenCalledWith([]);
    expect(sent).toBe(0);
    expect(failed).toBe(0);
    expect(suppressed).toBe(0);
  });

  it("counts all suppressed recipients", async () => {
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: [],
      suppressed: [recipientLucy.email, recipientMarcie.email],
    });

    const { sent, failed, suppressed } = await sendGroupEmails({
      ...defaultParams,
      recipients: [recipientLucy, recipientMarcie],
    });

    expect(mockFilterSuppressedEmails).toHaveBeenCalledWith([recipientLucy.email, recipientMarcie.email]);
    expect(sent).toBe(0);
    expect(failed).toBe(0);
    expect(suppressed).toBe(2);
  });
});
