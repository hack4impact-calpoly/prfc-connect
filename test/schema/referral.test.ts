import { ReferralSchema, CreateReferralSchema } from "@/schema/referral";
import { ReferralFormSchema } from "@/schema/api";
import { referralCharlie, createReferralInput, formWithTwoProspects } from "../mocks/referrals";

describe("ReferralSchema", () => {
  it("accepts valid referral", () => {
    expect(ReferralSchema.safeParse(referralCharlie).success).toBe(true);
  });

  it("coerces ISO string dates from JSON responses", () => {
    const asJsonResponse = {
      ...referralCharlie,
      createdAt: "2024-03-15T14:32:17.000Z",
      updatedAt: "2024-03-15T14:32:17.000Z",
    };

    const parsed = ReferralSchema.parse(asJsonResponse);

    expect(parsed.createdAt).toBeInstanceOf(Date);
    expect(parsed.updatedAt).toBeInstanceOf(Date);
  });

  it("rejects negative id", () => {
    const bad = { ...referralCharlie, id: -1 };
    expect(ReferralSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects malformed email", () => {
    const bad = { ...referralCharlie, memberEmail: "not-email" };
    expect(ReferralSchema.safeParse(bad).success).toBe(false);
  });
});

describe("CreateReferralSchema", () => {
  it("accepts valid creation input", () => {
    expect(CreateReferralSchema.safeParse(createReferralInput).success).toBe(true);
  });

  it("defaults redeemed to false when omitted", () => {
    const { redeemed: _redeemed, ...noRedeemed } = createReferralInput;
    const parsed = CreateReferralSchema.parse(noRedeemed);

    expect(parsed.redeemed).toBe(false);
  });
});

describe("ReferralFormSchema", () => {
  it("accepts 1-5 prospects", () => {
    expect(ReferralFormSchema.safeParse(formWithTwoProspects).success).toBe(true);
  });

  it("rejects empty prospects", () => {
    const bad = { ...formWithTwoProspects, prospects: [] };
    expect(ReferralFormSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects >5 prospects", () => {
    const tooMany = {
      ...formWithTwoProspects,
      prospects: [
        { prospectName: "Woodstock Bird", prospectEmail: "woodstock@gmail.com" },
        { prospectName: "Franklin Armstrong", prospectEmail: "franklin@yahoo.com" },
        { prospectName: "Pigpen Dust", prospectEmail: "pigpen@outlook.com" },
        { prospectName: "Violet Gray", prospectEmail: "violet.gray@icloud.com" },
        { prospectName: "Patty Swanson", prospectEmail: "patty.s@hotmail.com" },
        { prospectName: "Shermy Brown", prospectEmail: "shermy@gmail.com" },
      ],
    };
    expect(ReferralFormSchema.safeParse(tooMany).success).toBe(false);
  });
});
