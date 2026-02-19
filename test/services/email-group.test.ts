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
import { filterSuppressedEmails } from "@/services/email-suppression";
import {
  BobbyRecipient,
  CharlieRecipient,
  LucyRecipient,
  MarcieRecipient,
  SnoopyRecipient,
} from "../mocks/email-group";
import "nodemailer";

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
    expect(sendMailMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ to: BobbyRecipient.email }));
    expect(sendMailMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: LucyRecipient.email }));
    expect(sendMailMock).toHaveBeenNthCalledWith(3, expect.objectContaining({ to: MarcieRecipient.email }));
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
    expect(sendMailMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ to: BobbyRecipient.email }));
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it("generates unique unsubscribe token per recipient", async () => {
    /* Test */
  });

  it("includes List-Unsubscribe header (RFC 8058)", async () => {
    /* Test */
  });

  it("appends CAN-SPAM footer with physical address", async () => {
    /* Test */
  });

  it("batches emails (10 per batch)", async () => {
    /* Test */
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

    expect(filterSuppressedEmails).toHaveBeenCalledWith([]);
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
