import "../mocks/encryption";

import { mockPrisma } from "../mocks/prisma";
import { referralCharlie, referralLinusRedeemed, createReferralInput, allReferrals } from "../mocks/referrals";
import {
  getAllReferrals,
  getReferralById,
  createReferral,
  createManyReferrals,
  toggleReferralRedeemed,
  updateReferralRedeemed,
  deleteReferral,
} from "@/services/referral";

describe("getAllReferrals", () => {
  it("returns referrals ordered by createdAt desc", async () => {
    mockPrisma.referral.findMany.mockResolvedValue(allReferrals);

    const result = await getAllReferrals();

    expect(result).toEqual(allReferrals);
    expect(mockPrisma.referral.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("getReferralById", () => {
  it("returns referral when found", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(referralCharlie);

    const result = await getReferralById(1);

    expect(result).toEqual(referralCharlie);
  });

  it("throws NOT_FOUND when missing", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(null);

    await expect(getReferralById(999)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("createReferral", () => {
  it("persists validated referral", async () => {
    mockPrisma.referral.create.mockResolvedValue(referralCharlie);

    const result = await createReferral(createReferralInput);

    expect(result.id).toBe(1);
    expect(mockPrisma.referral.create).toHaveBeenCalled();
  });

  it("rejects invalid email format", async () => {
    const badInput = { ...createReferralInput, memberEmail: "not-an-email" };

    await expect(createReferral(badInput)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});

describe("toggleReferralRedeemed", () => {
  it("flips redeemed false->true", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(referralCharlie);
    mockPrisma.referral.update.mockResolvedValue({
      ...referralCharlie,
      redeemed: true,
    });

    const result = await toggleReferralRedeemed(1);

    expect(result.redeemed).toBe(true);
    expect(mockPrisma.referral.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { redeemed: true },
    });
  });

  it("flips redeemed true->false", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(referralLinusRedeemed);
    mockPrisma.referral.update.mockResolvedValue({
      ...referralLinusRedeemed,
      redeemed: false,
    });

    const result = await toggleReferralRedeemed(2);

    expect(result.redeemed).toBe(false);
    expect(mockPrisma.referral.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { redeemed: false },
    });
  });

  it("throws NOT_FOUND for missing referral", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(null);

    await expect(toggleReferralRedeemed(999)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("createManyReferrals", () => {
  const batchInput = [
    createReferralInput,
    { ...createReferralInput, prospectName: "Marcie Johnson", prospectEmail: "marcie.johnson@yahoo.com" },
  ];

  it("creates all referrals in transaction", async () => {
    const batchResult = [
      { ...referralCharlie, id: 7 },
      { ...referralCharlie, id: 8, prospectName: "Marcie Johnson" },
    ];
    mockPrisma.$transaction.mockResolvedValue(batchResult);

    const result = await createManyReferrals(batchInput);

    expect(result).toHaveLength(2);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("rejects batch with invalid email", async () => {
    const badBatch = [createReferralInput, { ...createReferralInput, memberEmail: "bad-email" }];

    await expect(createManyReferrals(badBatch)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rolls back on database error", async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error("Deadlock"));

    await expect(createManyReferrals(batchInput)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});

describe("updateReferralRedeemed", () => {
  it("sets redeemed to specified value", async () => {
    mockPrisma.referral.update.mockResolvedValue({ ...referralCharlie, redeemed: true });

    const result = await updateReferralRedeemed(1, true);

    expect(result.redeemed).toBe(true);
    expect(mockPrisma.referral.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { redeemed: true },
    });
  });

  it("throws on missing referral", async () => {
    mockPrisma.referral.update.mockRejectedValue(new Error("Record not found"));

    await expect(updateReferralRedeemed(999, true)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});

describe("deleteReferral", () => {
  it("deletes existing referral", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(referralCharlie);
    mockPrisma.referral.delete.mockResolvedValue(referralCharlie);

    const result = await deleteReferral(1);

    expect(result).toEqual(referralCharlie);
    expect(mockPrisma.referral.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it("throws NOT_FOUND for missing referral", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(null);

    await expect(deleteReferral(999)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
