/**
 * @jest-environment node
 */
import { prismaMock } from "../mocks/prisma";
import "../mocks/email";
import { referralCharlie, formWithTwoProspects } from "../mocks/referrals";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  verifyDatabaseAccess: jest.fn(),
}));

import { submitReferrals, toggleRedeemed } from "@/actions/referral";
import { verifyDatabaseAccess } from "@/lib/auth";

const mockVerifyDatabaseAccess = verifyDatabaseAccess as jest.MockedFunction<typeof verifyDatabaseAccess>;

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

  it("creates referrals and returns success", async () => {
    const created = [
      { ...referralCharlie, id: 10 },
      { ...referralCharlie, id: 11, prospectName: "Marcie Johnson" },
    ];
    prismaMock.$transaction.mockResolvedValue(created);

    const result = await submitReferrals(validFormData);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
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
    prismaMock.$transaction.mockRejectedValue(new Error("Connection lost"));

    const result = await submitReferrals(validFormData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("toggleRedeemed", () => {
  beforeEach(() => {
    mockVerifyDatabaseAccess.mockReset();
  });

  it("toggles redeemed status when authenticated", async () => {
    mockVerifyDatabaseAccess.mockResolvedValue({ authenticated: true });
    prismaMock.referral.findUnique.mockResolvedValue(referralCharlie);
    prismaMock.referral.update.mockResolvedValue({ ...referralCharlie, redeemed: true });

    const result = await toggleRedeemed(1);

    expect(result.success).toBe(true);
    expect(prismaMock.referral.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { redeemed: true },
    });
  });

  it("returns error when not authenticated", async () => {
    mockVerifyDatabaseAccess.mockRejectedValue(new Error("Database access required"));

    const result = await toggleRedeemed(1);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Database access required");
  });

  it("returns error for non-existent referral", async () => {
    mockVerifyDatabaseAccess.mockResolvedValue({ authenticated: true });
    prismaMock.referral.findUnique.mockResolvedValue(null);

    const result = await toggleRedeemed(999);

    expect(result.success).toBe(false);
  });
});
