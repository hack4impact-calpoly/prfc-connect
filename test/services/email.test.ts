import "../mocks/email";
import "../mocks/email-suppression";
import "../mocks/unsubscribe-tokens";
import "../mocks/email-quota";
import { mockBrevoSend } from "../mocks/email";
import { mockIsEmailSuppressed } from "../mocks/email-suppression";
import { mockReserveEmailQuota } from "../mocks/email-quota";
import { sendReferralEmails } from "@/services/email";

describe("sendReferralEmails", () => {
  beforeEach(() => {
    mockReserveEmailQuota.mockResolvedValue({ allowed: 1, total: 0 });
  });

  const prospects = [
    { prospectName: "Lucy Van Pelt", prospectEmail: "lucy.vanpelt@yahoo.com" },
    { prospectName: "Marcie Johnson", prospectEmail: "marcie.johnson@gmail.com" },
  ];

  it("sends email to each prospect and returns sent count", async () => {
    const result = await sendReferralEmails({
      prospects,
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockBrevoSend).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ sent: 2, skipped: 0 });
  });

  it("includes referral code in email", async () => {
    await sendReferralEmails({
      prospects: [prospects[0]],
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    const callArgs = mockBrevoSend.mock.calls[0][0];
    expect(callArgs.htmlContent).toContain("REF-7F3A9B");
  });

  it("throws EMAIL_ERROR on send failure", async () => {
    mockBrevoSend.mockRejectedValueOnce(new Error("Connection refused"));

    await expect(
      sendReferralEmails({
        prospects: [prospects[0]],
        referralCode: "REF-7F3A9B",
        memberName: "Charlie Brown",
      }),
    ).rejects.toMatchObject({
      code: "EMAIL_ERROR",
    });
  });

  it("skips suppressed prospect emails and counts them", async () => {
    mockIsEmailSuppressed.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await sendReferralEmails({
      prospects,
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockBrevoSend).toHaveBeenCalledTimes(1);
    expect(mockBrevoSend.mock.calls[0][0].to[0].email).toBe("marcie.johnson@gmail.com");
    expect(result).toEqual({ sent: 1, skipped: 1 });
  });

  it("skips all prospects when quota is exhausted", async () => {
    mockReserveEmailQuota.mockResolvedValue({ allowed: 0, total: 300 });

    const result = await sendReferralEmails({
      prospects,
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockBrevoSend).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, skipped: 2 });
  });

  it("sends some and skips rest when quota runs out mid-batch", async () => {
    mockReserveEmailQuota
      .mockResolvedValueOnce({ allowed: 1, total: 299 })
      .mockResolvedValueOnce({ allowed: 0, total: 300 });

    const result = await sendReferralEmails({
      prospects,
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockBrevoSend).toHaveBeenCalledTimes(1);
    expect(mockBrevoSend.mock.calls[0][0].to[0].email).toBe("lucy.vanpelt@yahoo.com");
    expect(result).toEqual({ sent: 1, skipped: 1 });
  });

  it("reserves quota per prospect not in bulk", async () => {
    await sendReferralEmails({
      prospects,
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockReserveEmailQuota).toHaveBeenCalledTimes(2);
    expect(mockReserveEmailQuota).toHaveBeenCalledWith(1);
  });

  it("does not reserve quota for suppressed prospects", async () => {
    mockIsEmailSuppressed.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await sendReferralEmails({
      prospects,
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockReserveEmailQuota).toHaveBeenCalledTimes(1);
  });

  it("escapes HTML in prospect name", async () => {
    await sendReferralEmails({
      prospects: [{ prospectName: '<script>alert("xss")</script>', prospectEmail: "xss@example.com" }],
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    const html = mockBrevoSend.mock.calls[0][0].htmlContent;
    expect(html).toContain("Hi &lt;script&gt;");
    expect(html).not.toContain("Hi <script>");
  });

  it("escapes HTML in member name", async () => {
    await sendReferralEmails({
      prospects: [prospects[0]],
      referralCode: "REF-7F3A9B",
      memberName: '<script>alert("xss")</script>',
    });

    const html = mockBrevoSend.mock.calls[0][0].htmlContent;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("includes unsubscribe link in email", async () => {
    await sendReferralEmails({
      prospects: [prospects[0]],
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    const html = mockBrevoSend.mock.calls[0][0].htmlContent;
    expect(html).toContain("Unsubscribe");
    expect(html).toContain("/unsubscribe?token=");
    expect(html).not.toContain("/api/unsubscribe");
  });

  it("includes List-Unsubscribe header", async () => {
    await sendReferralEmails({
      prospects: [prospects[0]],
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    const headers = mockBrevoSend.mock.calls[0][0].headers;
    expect(headers["List-Unsubscribe"]).toContain("/api/unsubscribe?token=");
    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("returns zero sent and zero skipped for empty prospects", async () => {
    const result = await sendReferralEmails({
      prospects: [],
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockBrevoSend).not.toHaveBeenCalled();
    expect(mockReserveEmailQuota).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, skipped: 0 });
  });

  it("includes textContent plain text fallback", async () => {
    await sendReferralEmails({
      prospects: [prospects[0]],
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    const textContent = mockBrevoSend.mock.calls[0][0].textContent;
    expect(textContent).toContain("Hi Lucy Van Pelt");
    expect(textContent).toContain("REF-7F3A9B");
    expect(textContent).toContain("pasofoodcooperative.com");
  });
});
