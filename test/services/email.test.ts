import "../mocks/email";
import "../mocks/email-suppression";
import "../mocks/unsubscribe-tokens";
import { mockBrevoSend } from "../mocks/email";
import { mockIsEmailSuppressed } from "../mocks/email-suppression";
import { sendReferralEmails } from "@/services/email";

describe("sendReferralEmails", () => {
  const prospects = [
    { prospectName: "Lucy Van Pelt", prospectEmail: "lucy.vanpelt@yahoo.com" },
    { prospectName: "Marcie Johnson", prospectEmail: "marcie.johnson@gmail.com" },
  ];

  it("sends email to each prospect", async () => {
    await sendReferralEmails({
      prospects,
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockBrevoSend).toHaveBeenCalledTimes(2);
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

  it("skips suppressed prospect emails", async () => {
    mockIsEmailSuppressed.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await sendReferralEmails({
      prospects,
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    expect(mockBrevoSend).toHaveBeenCalledTimes(1);
    expect(mockBrevoSend.mock.calls[0][0].to[0].email).toBe("marcie.johnson@gmail.com");
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
    expect(html).toContain("/api/unsubscribe?token=");
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
});
