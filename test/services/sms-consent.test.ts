import { prismaMock } from "../mocks/prisma";
import { activeConsentKermit } from "../mocks/sms-consent";
import { getMemberSmsConsent, hasActiveConsent, revokeSmsConsent } from "@/services/sms-consent";

describe("getMemberSmsConsent", () => {
  it("returns active consent record when found", async () => {
    prismaMock.smsConsent.findFirst.mockResolvedValue(activeConsentKermit as never);

    const result = await getMemberSmsConsent(100001);

    expect(result).toEqual(activeConsentKermit);
  });

  it("filters by revokedAt null to find only active consent", async () => {
    prismaMock.smsConsent.findFirst.mockResolvedValue(null);

    await getMemberSmsConsent(100001);

    expect(prismaMock.smsConsent.findFirst).toHaveBeenCalledWith({
      where: { memberId: 100001, revokedAt: null },
      select: {
        id: true,
        memberId: true,
        consentedAt: true,
        consentMethod: true,
        consentText: true,
        consentPurpose: true,
        revokedAt: true,
        revokeMethod: true,
      },
      orderBy: { consentedAt: "desc" },
    });
  });

  it("returns null when no active consent exists", async () => {
    prismaMock.smsConsent.findFirst.mockResolvedValue(null);

    const result = await getMemberSmsConsent(100001);

    expect(result).toBeNull();
  });

  it("throws on database error", async () => {
    prismaMock.smsConsent.findFirst.mockRejectedValue(new Error("Connection lost"));

    await expect(getMemberSmsConsent(100001)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("hasActiveConsent", () => {
  it("returns true when active consent exists", async () => {
    prismaMock.smsConsent.findFirst.mockResolvedValue({ id: 1 } as never);

    const result = await hasActiveConsent(100001);

    expect(result).toBe(true);
  });

  it("returns false when no active consent exists", async () => {
    prismaMock.smsConsent.findFirst.mockResolvedValue(null);

    const result = await hasActiveConsent(100001);

    expect(result).toBe(false);
  });

  it("throws on database error", async () => {
    prismaMock.smsConsent.findFirst.mockRejectedValue(new Error("Connection lost"));

    await expect(hasActiveConsent(100001)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("revokeSmsConsent", () => {
  it("sets revokedAt and method on active records", async () => {
    prismaMock.smsConsent.updateMany.mockResolvedValue({ count: 1 });

    await revokeSmsConsent(100001, "user_settings", "No longer want SMS");

    expect(prismaMock.smsConsent.updateMany).toHaveBeenCalledWith({
      where: { memberId: 100001, revokedAt: null },
      data: {
        revokedAt: expect.any(Date),
        revokeMethod: "user_settings",
        revokeMessage: "No longer want SMS",
      },
    });
  });

  it("handles zero matching records without error", async () => {
    prismaMock.smsConsent.updateMany.mockResolvedValue({ count: 0 });

    await expect(revokeSmsConsent(100001, "user_settings", null)).resolves.toBeUndefined();
  });

  it("throws on database error", async () => {
    prismaMock.smsConsent.updateMany.mockRejectedValue(new Error("Connection lost"));

    await expect(revokeSmsConsent(100001, "user_settings", null)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});
