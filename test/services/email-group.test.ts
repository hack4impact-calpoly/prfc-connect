import "../mocks/email";

import { vi } from "vitest";
import { mockResendSend } from "../mocks";

const mockFilterSuppressedEmails = vi.hoisted(() => vi.fn());

vi.mock("@/services/email-suppression", async () => ({
  filterSuppressedEmails: mockFilterSuppressedEmails,
}));

import { sendGroupEmails } from "@/services/email";
import {
  recipientBobby,
  recipientLucy,
  recipientMarcie,
  recipientCharlie,
  recipientSnoopy,
  allRecipients,
} from "../mocks/email-group";
import * as tokenModule from "@/lib/unsubscribe-tokens";

const tokenSpy = vi.spyOn(tokenModule, "generateUnsubscribeToken");

const defaultParams = {
  subject: "Test Subject",
  body: "<p>Test Body</p>",
  senderName: "Test Sender",
  replyTo: "reply@test.com",
  groupId: 123,
};

describe("sendGroupEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResendSend.mockResolvedValue({ data: { id: "mock-id" }, error: null });
  });

  it("sends to all valid recipients", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockFilterSuppressedEmails).toHaveBeenCalledWith(recipients.map((r) => r.email));
    expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({ to: recipientBobby.email }));
    expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({ to: recipientLucy.email }));
    expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({ to: recipientMarcie.email }));
    expect(mockResendSend).toHaveBeenCalledTimes(3);
  });

  it("filters out suppressed emails before sending", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: [recipientBobby.email],
      suppressed: [recipientLucy.email, recipientMarcie.email],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockFilterSuppressedEmails).toHaveBeenCalledWith(recipients.map((r) => r.email));
    expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({ to: recipientBobby.email }));
    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });

  it("generates unique unsubscribe token per recipient", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    const tokens = mockResendSend.mock.calls.map((call: unknown[]) => {
      const fields = call[0] as { headers: Record<string, string> };
      const raw = fields.headers["List-Unsubscribe"];
      const urlStr = raw.slice(1, -1);
      return new URL(urlStr).searchParams.get("token");
    });
    tokens.forEach((token: string | null) => expect(token).toBeTruthy());
    expect(new Set(tokens).size).toBe(tokens.length);
    expect(tokenSpy).toHaveBeenCalledTimes(3);
    expect(tokenSpy).toHaveBeenCalledWith(recipientBobby.memberId, 123);
    expect(tokenSpy).toHaveBeenCalledWith(recipientLucy.memberId, 123);
    expect(tokenSpy).toHaveBeenCalledWith(recipientMarcie.memberId, 123);
  });

  it("includes RFC 8058 one-click unsubscribe headers", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    mockFilterSuppressedEmails.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });

    await sendGroupEmails({ ...defaultParams, recipients });

    for (const [fields] of mockResendSend.mock.calls) {
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

    expect(mockResendSend).toHaveBeenCalledTimes(3);
    for (const [fields] of mockResendSend.mock.calls) {
      const html = String(fields.html ?? "");
      expect(html).toContain("Paso Robles Food Cooperative, Inc.");
      expect(html).toContain("P.O. Box 922, Paso Robles, CA 93447");
      expect(html).toMatch(/<a href="[^"]*\/api\/unsubscribe\?token=[^"]*"[^>]*>Unsubscribe from this group<\/a>/);
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

      await Promise.resolve();
      expect(mockResendSend).toHaveBeenCalledTimes(10);

      await vi.advanceTimersByTimeAsync(batchDelayMs - 1);
      await Promise.resolve();
      expect(mockResendSend).toHaveBeenCalledTimes(10);

      await vi.advanceTimersByTimeAsync(1);
      await Promise.resolve();
      expect(mockResendSend).toHaveBeenCalledTimes(12);

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
    mockResendSend
      .mockResolvedValueOnce({ data: { id: "1" }, error: null })
      .mockResolvedValueOnce({ data: { id: "2" }, error: null })
      .mockResolvedValueOnce({ data: { id: "3" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "Send failure", name: "api_error" } })
      .mockResolvedValueOnce({ data: { id: "5" }, error: null });

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockResendSend).toHaveBeenCalledTimes(5);
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
    mockResendSend
      .mockResolvedValueOnce({ data: null, error: { message: "API Error", name: "api_error" } })
      .mockResolvedValue({ data: { id: "ok" }, error: null });

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients });

    expect(mockResendSend).toHaveBeenCalledTimes(3);
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
