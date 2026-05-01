import { mockPrisma } from "../mocks/prisma";
import "../mocks/encryption";
import { activeConsentKermit } from "../mocks/sms-consent";
import {
  getMemberSmsConsent,
  hasActiveConsent,
  revokeSmsConsent,
  getConsentedPhones,
  grantSmsConsent,
} from "@/services/sms-consent";

describe("getMemberSmsConsent", () => {
  it("returns active consent record when found", async () => {
    mockPrisma.smsConsent.findFirst.mockResolvedValue(activeConsentKermit as never);

    const result = await getMemberSmsConsent(100001);

    expect(result).toEqual(activeConsentKermit);
  });

  it("filters by revokedAt null to find only active consent", async () => {
    mockPrisma.smsConsent.findFirst.mockResolvedValue(null);

    await getMemberSmsConsent(100001);

    expect(mockPrisma.smsConsent.findFirst).toHaveBeenCalledWith({
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
    mockPrisma.smsConsent.findFirst.mockResolvedValue(null);

    const result = await getMemberSmsConsent(100001);

    expect(result).toBeNull();
  });

  it("throws on database error", async () => {
    mockPrisma.smsConsent.findFirst.mockRejectedValue(new Error("Connection lost"));

    await expect(getMemberSmsConsent(100001)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("hasActiveConsent", () => {
  it("returns true when active consent exists", async () => {
    mockPrisma.smsConsent.findFirst.mockResolvedValue({ id: 1 } as never);

    const result = await hasActiveConsent(100001);

    expect(result).toBe(true);
  });

  it("returns false when no active consent exists", async () => {
    mockPrisma.smsConsent.findFirst.mockResolvedValue(null);

    const result = await hasActiveConsent(100001);

    expect(result).toBe(false);
  });

  it("throws on database error", async () => {
    mockPrisma.smsConsent.findFirst.mockRejectedValue(new Error("Connection lost"));

    await expect(hasActiveConsent(100001)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("revokeSmsConsent", () => {
  it("sets revokedAt and method on active records", async () => {
    mockPrisma.smsConsent.updateMany.mockResolvedValue({ count: 1 });

    await revokeSmsConsent(100001, "user_settings", "No longer want SMS");

    expect(mockPrisma.smsConsent.updateMany).toHaveBeenCalledWith({
      where: { memberId: 100001, revokedAt: null },
      data: {
        revokedAt: expect.any(Date),
        revokeMethod: "user_settings",
        revokeMessage: "No longer want SMS",
      },
    });
  });

  it("handles zero matching records without error", async () => {
    mockPrisma.smsConsent.updateMany.mockResolvedValue({ count: 0 });

    await expect(revokeSmsConsent(100001, "user_settings", null)).resolves.toBeUndefined();
  });

  it("throws on database error", async () => {
    mockPrisma.smsConsent.updateMany.mockRejectedValue(new Error("Connection lost"));

    await expect(revokeSmsConsent(100001, "user_settings", null)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});

describe("getConsentedPhones", () => {
  it("returns decrypted phones for members with active consent", async () => {
    mockPrisma.smsConsent.findMany.mockResolvedValue([
      { memberId: 100001, phone: "encrypted_phone_1" },
      { memberId: 100002, phone: "encrypted_phone_2" },
    ] as never);

    const result = await getConsentedPhones([100001, 100002]);

    expect(result.size).toBe(2);
    expect(result.get(100001)).toBe("encrypted_phone_1");
    expect(result.get(100002)).toBe("encrypted_phone_2");
  });

  it("returns empty map when no members have consent", async () => {
    mockPrisma.smsConsent.findMany.mockResolvedValue([]);

    const result = await getConsentedPhones([100001]);

    expect(result.size).toBe(0);
  });

  it("filters to only active consent (revokedAt null)", async () => {
    mockPrisma.smsConsent.findMany.mockResolvedValue([] as never);

    await getConsentedPhones([100001, 100002]);

    expect(mockPrisma.smsConsent.findMany).toHaveBeenCalledWith({
      where: { memberId: { in: [100001, 100002] }, revokedAt: null },
      select: { memberId: true, phone: true },
      orderBy: { consentedAt: "desc" },
    });
  });

  it("deduplicates by memberId keeping most recent consent", async () => {
    mockPrisma.smsConsent.findMany.mockResolvedValue([
      { memberId: 100001, phone: "newer_phone" },
      { memberId: 100001, phone: "older_phone" },
    ] as never);

    const result = await getConsentedPhones([100001]);

    expect(result.size).toBe(1);
    expect(result.get(100001)).toBe("newer_phone");
  });

  it("throws on database error", async () => {
    mockPrisma.smsConsent.findMany.mockRejectedValue(new Error("Connection lost"));

    await expect(getConsentedPhones([100001])).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("grantSmsConsent", () => {
  it("creates consent record when no active consent exists", async () => {
    mockPrisma.smsConsent.findFirst.mockResolvedValue(null);
    mockPrisma.smsConsent.create.mockResolvedValue({} as never);

    await grantSmsConsent(100001, "+15551234567");

    expect(mockPrisma.smsConsent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        memberId: 100001,
        consentMethod: "web_settings",
        consentPurpose: "group_messaging",
      }),
    });
  });

  it("skips creation when active consent already exists", async () => {
    mockPrisma.smsConsent.findFirst.mockResolvedValue({ id: 1 } as never);

    await grantSmsConsent(100001, "+15551234567");

    expect(mockPrisma.smsConsent.create).not.toHaveBeenCalled();
  });

  it("throws on database error", async () => {
    mockPrisma.smsConsent.findFirst.mockRejectedValue(new Error("Connection lost"));

    await expect(grantSmsConsent(100001, "+15551234567")).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
