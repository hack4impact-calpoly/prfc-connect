import { vi } from "vitest";

const sendMailMock = vi.hoisted(() => vi.fn());
const filterSuppressedEmailsMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/email-suppression", async () => ({
  filterSuppressedEmails: filterSuppressedEmailsMock,
}));
vi.mock("nodemailer", async () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: sendMailMock,
      close: vi.fn(),
    })),
  },
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
  });

  it("sends to all valid recipients", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });
    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith(recipients.map((r) => r.email));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: recipientBobby.email }));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: recipientLucy.email }));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: recipientMarcie.email }));
    expect(sendMailMock).toHaveBeenCalledTimes(3);
  });

  it("filters out suppressed emails before sending", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: [recipientBobby.email],
      suppressed: [recipientLucy.email, recipientMarcie.email],
    });
    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith(recipients.map((r) => r.email));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: recipientBobby.email }));
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it("generates unique unsubscribe token per recipient", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });
    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({ ...defaultParams, recipients });

    const tokens = sendMailMock.mock.calls.map(([fields]) => {
      const raw = fields.headers?.["List-Unsubscribe"]?.value as string;
      const urlStr = raw.slice(1, -1);
      return new URL(urlStr).searchParams.get("token");
    });
    tokens.forEach((token) => expect(token).toBeTruthy());
    expect(new Set(tokens).size).toBe(tokens.length);
    expect(tokenSpy).toHaveBeenCalledTimes(3);
    expect(tokenSpy).toHaveBeenCalledWith(recipientBobby.memberId, 123);
    expect(tokenSpy).toHaveBeenCalledWith(recipientLucy.memberId, 123);
    expect(tokenSpy).toHaveBeenCalledWith(recipientMarcie.memberId, 123);
  });

  it("includes RFC 8058 one-click unsubscribe headers", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });
    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({ ...defaultParams, recipients });

    for (const [fields] of sendMailMock.mock.calls) {
      expect(fields.headers).toEqual(
        expect.objectContaining({
          "List-Unsubscribe": expect.objectContaining({
            prepared: true,
            value: expect.stringMatching(/^<https?:\/\/.*\/api\/unsubscribe\?token=.+>$/),
          }),
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }),
      );
    }
  });

  it("appends CAN-SPAM footer with physical address", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });
    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({ ...defaultParams, recipients });

    expect(sendMailMock).toHaveBeenCalledTimes(3);
    for (const [fields] of sendMailMock.mock.calls) {
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
      filterSuppressedEmailsMock.mockResolvedValue({
        valid: allRecipients.map((r) => r.email),
        suppressed: [],
      });
      sendMailMock.mockImplementation(async () => undefined);

      const promise = sendGroupEmails({ ...defaultParams, recipients: allRecipients });

      await Promise.resolve();
      expect(sendMailMock).toHaveBeenCalledTimes(10);

      await vi.advanceTimersByTimeAsync(batchDelayMs - 1);
      await Promise.resolve();
      expect(sendMailMock).toHaveBeenCalledTimes(10);

      await vi.advanceTimersByTimeAsync(1);
      await Promise.resolve();
      expect(sendMailMock).toHaveBeenCalledTimes(12);

      const { sent, failed, suppressed } = await promise;
      expect(sent).toBe(12);
      expect(failed).toBe(0);
      expect(suppressed).toBe(0);
    });
  });

  it("returns correct send/fail counts", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie, recipientCharlie, recipientSnoopy];
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });
    sendMailMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("SMTP failure"))
      .mockResolvedValueOnce(undefined);

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients });

    expect(sendMailMock).toHaveBeenCalledTimes(5);
    expect(sent).toBe(4);
    expect(failed).toBe(1);
    expect(suppressed).toBe(0);
  });

  it("handles SMTP errors gracefully without throwing", async () => {
    const recipients = [recipientBobby, recipientLucy, recipientMarcie];
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: recipients.map((r) => r.email),
      suppressed: [],
    });
    sendMailMock.mockRejectedValueOnce(new Error("SMTP Error")).mockResolvedValue(undefined);

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients });

    expect(sendMailMock).toHaveBeenCalledTimes(3);
    expect(sent).toBe(2);
    expect(failed).toBe(1);
    expect(suppressed).toBe(0);
  });

  it("returns zeros with empty recipient list", async () => {
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: [],
      suppressed: [],
    });

    const { sent, failed, suppressed } = await sendGroupEmails({ ...defaultParams, recipients: [] });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith([]);
    expect(sent).toBe(0);
    expect(failed).toBe(0);
    expect(suppressed).toBe(0);
  });

  it("counts all suppressed recipients", async () => {
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: [],
      suppressed: [recipientLucy.email, recipientMarcie.email],
    });

    const { sent, failed, suppressed } = await sendGroupEmails({
      ...defaultParams,
      recipients: [recipientLucy, recipientMarcie],
    });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith([recipientLucy.email, recipientMarcie.email]);
    expect(sent).toBe(0);
    expect(failed).toBe(0);
    expect(suppressed).toBe(2);
  });
});
