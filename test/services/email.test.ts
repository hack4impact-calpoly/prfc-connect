import "../mocks/email";
import { mockResendSend } from "../mocks";
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

    expect(mockResendSend).toHaveBeenCalledTimes(2);
  });

  it("includes referral code in email", async () => {
    await sendReferralEmails({
      prospects: [prospects[0]],
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    const callArgs = mockResendSend.mock.calls[0][0];
    expect(callArgs.html).toContain("REF-7F3A9B");
  });

  it("throws EMAIL_ERROR on send failure", async () => {
    mockResendSend.mockResolvedValueOnce({ data: null, error: { message: "Connection refused", name: "api_error" } });

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
});
