import { mockPrisma } from "../mocks/prisma";
import { getUserPreferences, updateUserPreferences } from "@/services/user-preference";

describe("getUserPreferences", () => {
  it("returns stored preferences when record exists", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue({
      notifyEmailDefault: false,
      notifySmsDefault: true,
    } as never);

    const result = await getUserPreferences(100001);

    expect(result).toEqual({ notifyEmailDefault: false, notifySmsDefault: true });
  });

  it("returns defaults when no record exists", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);

    const result = await getUserPreferences(100001);

    expect(result).toEqual({ notifyEmailDefault: true, notifySmsDefault: false });
  });

  it("throws on database error", async () => {
    mockPrisma.userPreference.findUnique.mockRejectedValue(new Error("Connection lost"));

    await expect(getUserPreferences(100001)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("updateUserPreferences", () => {
  it("upserts with provided fields and defaults for missing fields", async () => {
    mockPrisma.userPreference.upsert.mockResolvedValue({
      notifyEmailDefault: false,
      notifySmsDefault: false,
    } as never);

    await updateUserPreferences(100001, { notifyEmailDefault: false });

    expect(mockPrisma.userPreference.upsert).toHaveBeenCalledWith({
      where: { memberId: 100001 },
      create: { memberId: 100001, notifyEmailDefault: false, notifySmsDefault: false },
      update: { notifyEmailDefault: false },
      select: { notifyEmailDefault: true, notifySmsDefault: true },
    });
  });

  it("returns updated preferences", async () => {
    mockPrisma.userPreference.upsert.mockResolvedValue({
      notifyEmailDefault: true,
      notifySmsDefault: true,
    } as never);

    const result = await updateUserPreferences(100001, { notifySmsDefault: true });

    expect(result).toEqual({ notifyEmailDefault: true, notifySmsDefault: true });
  });

  it("throws on database error", async () => {
    mockPrisma.userPreference.upsert.mockRejectedValue(new Error("Connection lost"));

    await expect(updateUserPreferences(100001, { notifyEmailDefault: true })).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});
