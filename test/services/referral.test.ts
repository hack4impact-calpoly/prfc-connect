/**
 * @jest-environment node
 */
import { prismaMock } from "../mocks/prisma";
import { referralCharlie, referralLinusRedeemed, createReferralInput, allReferrals } from "../mocks/referrals";
import {
  getAllReferrals,
  getReferralById,
  createReferral,
  createManyReferrals,
  toggleReferralRedeemed,
  updateReferralRedeemed,
} from "@/services/referral";

describe("getAllReferrals", () => {
  it("returns referrals ordered by createdAt desc", async () => {
    prismaMock.referral.findMany.mockResolvedValue(allReferrals);

    const result = await getAllReferrals();

    expect(result).toEqual(allReferrals);
    expect(prismaMock.referral.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("getReferralById", () => {
  it("returns referral when found", async () => {
    prismaMock.referral.findUnique.mockResolvedValue(referralCharlie);

    const result = await getReferralById(1);

    expect(result).toEqual(referralCharlie);
  });

  it("throws NOT_FOUND when missing", async () => {
    prismaMock.referral.findUnique.mockResolvedValue(null);

    await expect(getReferralById(999)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("createReferral", () => {
  it("persists validated referral", async () => {
    prismaMock.referral.create.mockResolvedValue(referralCharlie);

    const result = await createReferral(createReferralInput);

    expect(result.id).toBe(1);
    expect(prismaMock.referral.create).toHaveBeenCalled();
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
    prismaMock.referral.findUnique.mockResolvedValue(referralCharlie);
    prismaMock.referral.update.mockResolvedValue({
      ...referralCharlie,
      redeemed: true,
    });

    const result = await toggleReferralRedeemed(1);

    expect(result.redeemed).toBe(true);
    expect(prismaMock.referral.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { redeemed: true },
    });
  });

  it("flips redeemed true->false", async () => {
    prismaMock.referral.findUnique.mockResolvedValue(referralLinusRedeemed);
    prismaMock.referral.update.mockResolvedValue({
      ...referralLinusRedeemed,
      redeemed: false,
    });

    const result = await toggleReferralRedeemed(2);

    expect(result.redeemed).toBe(false);
    expect(prismaMock.referral.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { redeemed: false },
    });
  });

  it("throws NOT_FOUND for missing referral", async () => {
    prismaMock.referral.findUnique.mockResolvedValue(null);

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
    prismaMock.$transaction.mockResolvedValue(batchResult);

    const result = await createManyReferrals(batchInput);

    expect(result).toHaveLength(2);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("rejects batch with invalid email", async () => {
    const badBatch = [createReferralInput, { ...createReferralInput, memberEmail: "bad-email" }];

    await expect(createManyReferrals(badBatch)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rolls back on database error", async () => {
    prismaMock.$transaction.mockRejectedValue(new Error("Deadlock"));

    await expect(createManyReferrals(batchInput)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});

describe("updateReferralRedeemed", () => {
  it("sets redeemed to specified value", async () => {
    prismaMock.referral.update.mockResolvedValue({ ...referralCharlie, redeemed: true });

    const result = await updateReferralRedeemed(1, true);

    expect(result.redeemed).toBe(true);
    expect(prismaMock.referral.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { redeemed: true },
    });
  });

  it("throws on missing referral", async () => {
    prismaMock.referral.update.mockRejectedValue(new Error("Record not found"));

    await expect(updateReferralRedeemed(999, true)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});
