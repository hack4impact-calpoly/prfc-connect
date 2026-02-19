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
  BobbyRecipient,
  CharlieRecipient,
  FranklinRecipient,
  LinusRecipient,
  LucyRecipient,
  MarcieRecipient,
  PeppermintPattyRecipient,
  PigpenRecipient,
  SallyRecipient,
  SchroederRecipient,
  SnoopyRecipient,
  WoodstockRecipient,
} from "../mocks/email-group";
import "nodemailer";
import * as tokenModule from "@/lib/unsubscribe-tokens";

const tokenSpy = vi.spyOn(tokenModule, "generateUnsubscribeToken");

describe("sendGroupEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends to all valid recipients", async () => {
    const test_recipients = [BobbyRecipient, LucyRecipient, MarcieRecipient];
    const test_emails = test_recipients.map((r) => r.email);
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: [BobbyRecipient.email, LucyRecipient.email, MarcieRecipient.email],
      suppressed: [],
    });

    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({
      recipients: test_recipients,
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith(test_emails);
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: BobbyRecipient.email }));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: LucyRecipient.email }));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: MarcieRecipient.email }));
    expect(sendMailMock).toHaveBeenCalledTimes(3);
  });

  it("filters out suppressed emails before sending", async () => {
    const test_recipients = [BobbyRecipient, LucyRecipient, MarcieRecipient];
    const test_emails = test_recipients.map((r) => r.email);
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: [BobbyRecipient.email],
      suppressed: [LucyRecipient.email, MarcieRecipient.email],
    });

    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({
      recipients: test_recipients,
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith(test_emails);
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: BobbyRecipient.email }));
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it("generates unique unsubscribe token per recipient", async () => {
    /* This test should be in its own file for unsubscribe-tokens.ts */
    const test_recipients = [BobbyRecipient, LucyRecipient, MarcieRecipient];
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: [BobbyRecipient.email, LucyRecipient.email, MarcieRecipient.email],
      suppressed: [],
    });

    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({
      recipients: test_recipients,
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    const tokens = sendMailMock.mock.calls.map(([fields]) => {
      const raw = fields.headers?.["List-Unsubscribe"]?.value as string;
      const urlStr = raw.slice(1, -1);
      return new URL(urlStr).searchParams.get("token");
    });
    tokens.forEach((token) => expect(token).toBeTruthy());
    expect(new Set(tokens).size).toBe(tokens.length);
    expect(tokenSpy).toHaveBeenCalledTimes(3);
    expect(tokenSpy).toHaveBeenCalledWith(BobbyRecipient.memberId, 123);
    expect(tokenSpy).toHaveBeenCalledWith(LucyRecipient.memberId, 123);
    expect(tokenSpy).toHaveBeenCalledWith(MarcieRecipient.memberId, 123);
  });

  it("includes List-Unsubscribe header (RFC 8058)", async () => {
    const test_recipients = [BobbyRecipient, LucyRecipient, MarcieRecipient];
    const test_emails = test_recipients.map((r) => r.email);
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: test_emails,
      suppressed: [],
    });

    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({
      recipients: test_recipients,
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    test_emails.forEach((email) => {
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          headers: expect.objectContaining({
            "List-Unsubscribe": expect.any(Object),
          }),
        }),
      );
    });
  });

  it("appends CAN-SPAM footer with physical address", async () => {
    const test_recipients = [BobbyRecipient, LucyRecipient, MarcieRecipient];
    const test_emails = test_recipients.map((r) => r.email);
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: test_emails,
      suppressed: [],
    });

    sendMailMock.mockResolvedValue(undefined);

    await sendGroupEmails({
      recipients: test_recipients,
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    expect(sendMailMock).toHaveBeenCalledTimes(3);
    for (const [fields] of sendMailMock.mock.calls) {
      const html = String(fields.html ?? "");
      expect(html).toContain("Paso Robles Food Cooperative, Inc.");
      expect(html).toContain("P.O. Box 922, Paso Robles, CA 93447");
      expect(html).toMatch(/<a href="[^"]*\/api\/unsubscribe\?token=[^"]*"[^>]*>Unsubscribe from this group<\/a>/);
    }
  });

  it("batches emails (10 per batch)", async () => {
    vi.useFakeTimers();
    const test_recipients = [
      BobbyRecipient,
      LucyRecipient,
      MarcieRecipient,
      CharlieRecipient,
      SnoopyRecipient,
      LinusRecipient,
      PeppermintPattyRecipient,
      SchroederRecipient,
      SallyRecipient,
      WoodstockRecipient,
      FranklinRecipient,
      PigpenRecipient,
    ];
    const test_emails = test_recipients.map((r) => r.email);
    const BATCH_DELAY_MS = 1000;

    filterSuppressedEmailsMock.mockResolvedValue({
      valid: test_emails,
      suppressed: [],
    });

    sendMailMock.mockImplementation(async () => undefined);

    const promise = sendGroupEmails({
      recipients: test_recipients,
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    await Promise.resolve();

    expect(sendMailMock).toHaveBeenCalledTimes(10);

    await vi.advanceTimersByTimeAsync(BATCH_DELAY_MS - 1);
    await Promise.resolve();
    expect(sendMailMock).toHaveBeenCalledTimes(10);

    await vi.advanceTimersByTimeAsync(1);
    await Promise.resolve();
    expect(sendMailMock).toHaveBeenCalledTimes(12);

    const { sent, failed, suppressed } = await promise;
    expect(sent).toBe(12);
    expect(failed).toBe(0);
    expect(suppressed).toBe(0);

    vi.useRealTimers();
  });

  it("returns correct send/fail counts", async () => {
    const test_recipients = [BobbyRecipient, LucyRecipient, MarcieRecipient, CharlieRecipient, SnoopyRecipient];
    const test_emails = test_recipients.map((r) => r.email);

    filterSuppressedEmailsMock.mockResolvedValue({
      valid: test_emails,
      suppressed: [],
    });

    sendMailMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const { sent, failed, suppressed } = await sendGroupEmails({
      recipients: test_recipients,
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith(test_emails);
    expect(sendMailMock).toHaveBeenCalledTimes(5);
    expect(sent).toBe(4);
    expect(failed).toBe(1);
    expect(suppressed).toBe(0);
  });

  it("handles SMTP errors gracefully (no throw)", async () => {
    const test_recipients = [BobbyRecipient, LucyRecipient, MarcieRecipient];
    const test_emails = test_recipients.map((r) => r.email);

    filterSuppressedEmailsMock.mockResolvedValue({
      valid: test_emails,
      suppressed: [],
    });

    sendMailMock.mockRejectedValueOnce(new Error("SMTP Error")).mockResolvedValue(undefined);

    const { sent, failed, suppressed } = await sendGroupEmails({
      recipients: test_recipients,
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith(test_emails);
    expect(sendMailMock).toHaveBeenCalledTimes(3);
    expect(sent).toBe(2);
    expect(failed).toBe(1);
    expect(suppressed).toBe(0);
  });

  it("returns {sent: 0, failed: 0} with empty recipient list", async () => {
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: [],
      suppressed: [],
    });

    const { sent, failed, suppressed } = await sendGroupEmails({
      recipients: [],
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith([]);
    expect(sent).toBe(0);
    expect(failed).toBe(0);
    expect(suppressed).toBe(0);
  });

  it("returns {sent: 0, failed: 0, suppressed: n} with n suppressed returns", async () => {
    filterSuppressedEmailsMock.mockResolvedValue({
      valid: [],
      suppressed: [LucyRecipient.email, MarcieRecipient.email],
    });

    const { sent, failed, suppressed } = await sendGroupEmails({
      recipients: [LucyRecipient, MarcieRecipient],
      subject: "",
      body: "",
      senderName: "",
      replyTo: "",
      groupId: 123,
    });

    expect(filterSuppressedEmailsMock).toHaveBeenCalledWith([LucyRecipient.email, MarcieRecipient.email]);
    expect(sent).toBe(0);
    expect(failed).toBe(0);
    expect(suppressed).toBe(2);
  });
});
