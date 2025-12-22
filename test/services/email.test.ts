import "../mocks/email";
import { emailTransportMock } from "../mocks";
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

    expect(emailTransportMock.sendMail).toHaveBeenCalledTimes(2);
  });

  it("includes referral code in email", async () => {
    await sendReferralEmails({
      prospects: [prospects[0]],
      referralCode: "REF-7F3A9B",
      memberName: "Charlie Brown",
    });

    const callArgs = emailTransportMock.sendMail.mock.calls[0][0];
    expect(callArgs.html).toContain("REF-7F3A9B");
  });

  it("throws EMAIL_ERROR on SMTP failure", async () => {
    emailTransportMock.sendMail.mockRejectedValueOnce(new Error("Connection refused"));

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
