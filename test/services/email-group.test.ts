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
    mockBrevoSend.mockResolvedValue({ messageId: "mock-id", remaining: null });
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

  it("wraps body in table-based HTML email template", async () => {
    const recipients = [recipientBobby];
    mockFilterSuppressedEmails.mockResolvedValue({ valid: [recipientBobby.email], suppressed: [] });

    await sendGroupEmails({ ...defaultParams, recipients });

    const html = String(mockBrevoSend.mock.calls[0][0].htmlContent ?? "");
    expect(html).toContain('role="presentation"');
    expect(html).toContain("background-color: #ffffff");
    expect(html).toContain("max-width: 600px");
  });

  it("includes textContent plain text fallback", async () => {
    const recipients = [recipientBobby];
    mockFilterSuppressedEmails.mockResolvedValue({ valid: [recipientBobby.email], suppressed: [] });

    await sendGroupEmails({ ...defaultParams, recipients });

    const textContent = mockBrevoSend.mock.calls[0][0].textContent;
    expect(textContent).toBeDefined();
    expect(textContent).toContain("Paso Robles Food Cooperative");
    expect(textContent).toContain("Unsubscribe");
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
    mockBrevoSend.mockRejectedValueOnce(new Error("API Error")).mockResolvedValue({ messageId: "ok", remaining: null });

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockBrevoSend).toHaveBeenCalledTimes(3);
    expect(sent).toBe(2);
    expect(failed).toBe(1);
    expect(suppressed).toBe(0);
  });

  it("logs email send errors with [EMAIL_SEND_ERROR] prefix", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const recipients = [recipientBobby];
    mockFilterSuppressedEmails.mockResolvedValue({ valid: [recipientBobby.email], suppressed: [] });
    const sendError = new Error("Connection timeout");
    mockBrevoSend.mockRejectedValueOnce(sendError);

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(spy).toHaveBeenCalledWith("[EMAIL_SEND_ERROR]", sendError);
    spy.mockRestore();
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

  describe("quota exhaustion", () => {
    it("marks recipients as queued when QUOTA_EXCEEDED", async () => {
      const { AppError } = await import("@/utils/errors");
      const recipients = [recipientBobby, recipientLucy];
      mockFilterSuppressedEmails.mockResolvedValue({ valid: recipients.map((r) => r.email), suppressed: [] });
      mockBrevoSend
        .mockResolvedValueOnce({ messageId: "ok-1", remaining: 0 })
        .mockRejectedValueOnce(new AppError("QUOTA_EXCEEDED", "Daily limit reached"));

      const { sent, failed, results } = await sendGroupEmails({ ...defaultParams, recipients });

      expect(sent).toBe(1);
      expect(failed).toBe(0);
      expect(results.find((r) => r.memberId === recipientBobby.memberId)?.status).toBe("sent");
      expect(results.find((r) => r.memberId === recipientLucy.memberId)?.status).toBe("queued");
    });

    it("breaks loop and queues remaining batches on QUOTA_EXCEEDED", async () => {
      const { AppError } = await import("@/utils/errors");
      mockFilterSuppressedEmails.mockResolvedValue({
        valid: allRecipients.map((r) => r.email),
        suppressed: [],
      });

      for (let i = 0; i < 10; i++) {
        mockBrevoSend.mockResolvedValueOnce({ messageId: `ok-${i}`, remaining: 290 - i });
      }
      mockBrevoSend.mockRejectedValue(new AppError("QUOTA_EXCEEDED", "Daily limit reached"));

      const { sent, failed, results } = await sendGroupEmails({ ...defaultParams, recipients: allRecipients });

      expect(sent).toBe(10);
      expect(failed).toBe(0);
      const queuedCount = results.filter((r) => r.status === "queued").length;
      expect(queuedCount).toBe(allRecipients.length - 10);
      expect(mockBrevoSend).toHaveBeenCalledTimes(12);
    });

    it("still marks non-quota errors as failed", async () => {
      const recipients = [recipientBobby];
      mockFilterSuppressedEmails.mockResolvedValue({ valid: [recipientBobby.email], suppressed: [] });
      mockBrevoSend.mockRejectedValueOnce(new Error("Connection timeout"));

      const { sent, failed, results } = await sendGroupEmails({ ...defaultParams, recipients });

      expect(sent).toBe(0);
      expect(failed).toBe(1);
      expect(results[0].status).toBe("failed");
    });

    it("handles mix of success and QUOTA_EXCEEDED in same batch", async () => {
      const { AppError } = await import("@/utils/errors");
      const recipients = [recipientBobby, recipientLucy, recipientMarcie];
      mockFilterSuppressedEmails.mockResolvedValue({ valid: recipients.map((r) => r.email), suppressed: [] });
      mockBrevoSend
        .mockResolvedValueOnce({ messageId: "ok-1", remaining: 1 })
        .mockResolvedValueOnce({ messageId: "ok-2", remaining: 0 })
        .mockRejectedValueOnce(new AppError("QUOTA_EXCEEDED", "Daily limit reached"));

      const { sent, failed, results } = await sendGroupEmails({ ...defaultParams, recipients });

      expect(sent).toBe(2);
      expect(failed).toBe(0);
      const queued = results.filter((r) => r.status === "queued");
      expect(queued.length).toBe(1);
    });
  });
});
