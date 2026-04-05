import "../mocks/next-cache";
import "../mocks/dal";
import "../mocks/email";
import "../mocks/encryption";

import { mockPrisma, mockVerifySession, mockRequireAdmin } from "../mocks";
import { referralCharlie, formWithTwoProspects } from "../mocks/referrals";
import { AppError } from "@/utils/errors";

import { submitReferrals, toggleRedeemed } from "@/actions/referral";

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

describe("submitReferrals", () => {
  const validFormData = createFormData({
    memberName: formWithTwoProspects.memberName,
    memberEmail: formWithTwoProspects.memberEmail,
    referralCode: formWithTwoProspects.referralCode,
    prospects: JSON.stringify(formWithTwoProspects.prospects),
  });

  beforeEach(() => {
    mockVerifySession.mockReset();
    mockVerifySession.mockResolvedValue({ ownerid: 100184, isAdmin: false });
  });

  it("creates referrals and returns success", async () => {
    const created = [
      { ...referralCharlie, id: 10 },
      { ...referralCharlie, id: 11, prospectName: "Marcie Johnson" },
    ];
    mockPrisma.$transaction.mockResolvedValue(created);

    const result = await submitReferrals(validFormData);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns error when not authenticated", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await submitReferrals(validFormData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Authentication required");
  });

  it("returns error for invalid prospects JSON", async () => {
    const badFormData = createFormData({
      memberName: "Charlie Brown",
      memberEmail: "charlie@test.com",
      referralCode: "REF001",
      prospects: "not-json",
    });

    const result = await submitReferrals(badFormData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid prospects data format");
  });

  it("returns validation error for missing fields", async () => {
    const incompleteFormData = createFormData({
      memberName: "Charlie Brown",
      prospects: JSON.stringify([{ prospectName: "Lucy", prospectEmail: "lucy@test.com" }]),
    });

    const result = await submitReferrals(incompleteFormData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error on database failure", async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error("Connection lost"));

    const result = await submitReferrals(validFormData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("toggleRedeemed", () => {
  beforeEach(() => {
    mockRequireAdmin.mockReset();
  });

  it("toggles redeemed status when authenticated", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100184, isAdmin: true });
    mockPrisma.referral.findUnique.mockResolvedValue(referralCharlie);
    mockPrisma.referral.update.mockResolvedValue({ ...referralCharlie, redeemed: true });

    const result = await toggleRedeemed(1);

    expect(result.success).toBe(true);
    expect(mockPrisma.referral.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { redeemed: true },
    });
  });

  it("returns error when not authenticated", async () => {
    mockRequireAdmin.mockRejectedValue(new AppError("FORBIDDEN", "Admin access required"));

    const result = await toggleRedeemed(1);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Admin access required");
  });

  it("returns error for non-existent referral", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100184, isAdmin: true });
    mockPrisma.referral.findUnique.mockResolvedValue(null);

    const result = await toggleRedeemed(999);

    expect(result.success).toBe(false);
  });
});
