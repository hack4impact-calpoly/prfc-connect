import { generateReferralPdf } from "@/services/referral-pdf";
import type { ApiReferral } from "@/schema/api";

const baseReferral: ApiReferral = {
  id: 1,
  createdAt: new Date("2024-03-15T14:32:17Z"),
  updatedAt: new Date("2024-03-15T14:32:17Z"),
  memberName: "Charlie Brown",
  memberEmail: "charlie@example.com",
  prospectName: "Lucy Van Pelt",
  prospectEmail: "lucy@example.com",
  referralCode: "REF001",
  redeemed: false,
};

describe("generateReferralPdf", () => {
  it("returns a Buffer containing a valid PDF header", () => {
    const buffer = generateReferralPdf({
      referrals: [baseReferral],
      exportedByOwnerid: 100001,
      exportedAt: new Date("2024-03-15T14:32:17Z"),
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("includes the exporting admin ownerid in the document", () => {
    const buffer = generateReferralPdf({
      referrals: [baseReferral],
      exportedByOwnerid: 100001,
      exportedAt: new Date("2024-03-15T14:32:17Z"),
    });

    expect(buffer.toString("binary")).toContain("100001");
  });

  it("includes the record count in the document", () => {
    const buffer = generateReferralPdf({
      referrals: [baseReferral, { ...baseReferral, id: 2 }, { ...baseReferral, id: 3 }],
      exportedByOwnerid: 100001,
      exportedAt: new Date("2024-03-15T14:32:17Z"),
    });

    expect(buffer.toString("binary")).toContain("3 records");
  });

  it("handles an empty referral list", () => {
    const buffer = generateReferralPdf({
      referrals: [],
      exportedByOwnerid: 100001,
      exportedAt: new Date("2024-03-15T14:32:17Z"),
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.toString("binary")).toContain("0 records");
  });
});
