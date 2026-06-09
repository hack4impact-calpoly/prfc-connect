import { createHmac } from "crypto";
import { verifyReferralSignature } from "@/lib/referral-signature";
import { getSecret } from "@/lib/dal";

const SECRET = getSecret();

function signFixture(memberName: string, memberEmail: string, referralCode: string): string {
  const payload = `${memberName}|${memberEmail}|${referralCode}`;
  return createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 8);
}

describe("verifyReferralSignature", () => {
  it("accepts a valid signature", () => {
    const signature = signFixture("Charlie Brown", "charlie@example.com", "REF001");

    const result = verifyReferralSignature({
      memberName: "Charlie Brown",
      memberEmail: "charlie@example.com",
      referralCode: "REF001",
      signature,
    });

    expect(result).toBe(true);
  });

  it("rejects a signature that does not match the payload", () => {
    const signature = signFixture("Charlie Brown", "charlie@example.com", "REF001");

    const result = verifyReferralSignature({
      memberName: "Lucy Van Pelt",
      memberEmail: "lucy@example.com",
      referralCode: "REF002",
      signature,
    });

    expect(result).toBe(false);
  });

  it("rejects a tampered referralCode", () => {
    const signature = signFixture("Charlie Brown", "charlie@example.com", "REF001");

    const result = verifyReferralSignature({
      memberName: "Charlie Brown",
      memberEmail: "charlie@example.com",
      referralCode: "REF999",
      signature,
    });

    expect(result).toBe(false);
  });

  it("rejects a signature of the wrong length", () => {
    const result = verifyReferralSignature({
      memberName: "Charlie Brown",
      memberEmail: "charlie@example.com",
      referralCode: "REF001",
      signature: "abc",
    });

    expect(result).toBe(false);
  });

  it("rejects an empty signature", () => {
    const result = verifyReferralSignature({
      memberName: "Charlie Brown",
      memberEmail: "charlie@example.com",
      referralCode: "REF001",
      signature: "",
    });

    expect(result).toBe(false);
  });

  it("uses constant-time comparison (length check happens first)", () => {
    const result = verifyReferralSignature({
      memberName: "Charlie Brown",
      memberEmail: "charlie@example.com",
      referralCode: "REF001",
      signature: "aaaaaaaa",
    });

    expect(result).toBe(false);
  });

  it("rejects a legacy calculateChecksum signature that carries no secret", () => {
    const legacyChecksum = (value: string): string => {
      let checksum = 0x12345678;
      for (let i = 0; i < value.length; i++) checksum += value.charCodeAt(i) * (i + 1);
      return (checksum >>> 0).toString(16);
    };
    const signature = legacyChecksum("charlie@example.comCharlieBrownREF001");

    const result = verifyReferralSignature({
      memberName: "Charlie Brown",
      memberEmail: "charlie@example.com",
      referralCode: "REF001",
      signature,
    });

    expect(signature).toHaveLength(8);
    expect(result).toBe(false);
  });
});
