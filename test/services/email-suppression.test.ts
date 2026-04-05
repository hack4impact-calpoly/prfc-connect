vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((v: string) => `encrypted:${v}`),
  decrypt: vi.fn((v: string) => v.replace("encrypted:", "")),
  blindIndex: vi.fn((v: string) => `hash:${v.toLowerCase()}`),
}));

import { mockPrisma } from "../mocks/prisma";
import { suppressedLucy } from "../mocks/email-suppressions";
import { isEmailSuppressed, suppressEmail, filterSuppressedEmails } from "@/services/email-suppression";

describe("isEmailSuppressed", () => {
  it("returns true when email exists in suppression list", async () => {
    mockPrisma.emailSuppression.findUnique.mockResolvedValue(suppressedLucy);

    const result = await isEmailSuppressed("lucy@yahoo.com");

    expect(result).toBe(true);
  });

  it("returns false when email not found", async () => {
    mockPrisma.emailSuppression.findUnique.mockResolvedValue(null);

    const result = await isEmailSuppressed("charlie@test.com");

    expect(result).toBe(false);
  });

  it("queries by blind index hash", async () => {
    mockPrisma.emailSuppression.findUnique.mockResolvedValue(suppressedLucy);

    await isEmailSuppressed("LUCY@YAHOO.COM");

    expect(mockPrisma.emailSuppression.findUnique).toHaveBeenCalledWith({
      where: { emailHash: "hash:lucy@yahoo.com" },
    });
  });
});

describe("suppressEmail", () => {
  it("upserts suppression with encrypted email and hash", async () => {
    mockPrisma.emailSuppression.upsert.mockResolvedValue(suppressedLucy);

    await suppressEmail("lucy@yahoo.com", "hard_bounce");

    expect(mockPrisma.emailSuppression.upsert).toHaveBeenCalledWith({
      where: { emailHash: "hash:lucy@yahoo.com" },
      update: { reason: "hard_bounce", suppressedAt: expect.any(Date) },
      create: { email: "encrypted:lucy@yahoo.com", emailHash: "hash:lucy@yahoo.com", reason: "hard_bounce" },
    });
  });

  it("normalizes email to lowercase before hashing and encrypting", async () => {
    mockPrisma.emailSuppression.upsert.mockResolvedValue(suppressedLucy);

    await suppressEmail("LUCY@YAHOO.COM", "complaint");

    expect(mockPrisma.emailSuppression.upsert).toHaveBeenCalledWith({
      where: { emailHash: "hash:lucy@yahoo.com" },
      update: { reason: "complaint", suppressedAt: expect.any(Date) },
      create: { email: "encrypted:lucy@yahoo.com", emailHash: "hash:lucy@yahoo.com", reason: "complaint" },
    });
  });
});

describe("filterSuppressedEmails", () => {
  it("separates suppressed from valid emails", async () => {
    mockPrisma.emailSuppression.findMany.mockResolvedValue([
      { emailHash: "hash:lucy@yahoo.com" } as never,
      { emailHash: "hash:marcie@gmail.com" } as never,
    ]);

    const result = await filterSuppressedEmails([
      "charlie@test.com",
      "lucy@yahoo.com",
      "marcie@gmail.com",
      "snoopy@test.com",
    ]);

    expect(result.valid).toEqual(["charlie@test.com", "snoopy@test.com"]);
    expect(result.suppressed).toEqual(["lucy@yahoo.com", "marcie@gmail.com"]);
  });

  it("handles case-insensitive matching via blind index", async () => {
    mockPrisma.emailSuppression.findMany.mockResolvedValue([{ emailHash: "hash:lucy@yahoo.com" } as never]);

    const result = await filterSuppressedEmails(["LUCY@YAHOO.COM", "charlie@test.com"]);

    expect(result.valid).toEqual(["charlie@test.com"]);
    expect(result.suppressed).toEqual(["LUCY@YAHOO.COM"]);
  });

  it("returns empty arrays for empty input", async () => {
    mockPrisma.emailSuppression.findMany.mockResolvedValue([]);

    const result = await filterSuppressedEmails([]);

    expect(result.valid).toEqual([]);
    expect(result.suppressed).toEqual([]);
  });

  it("returns all emails as valid when none suppressed", async () => {
    mockPrisma.emailSuppression.findMany.mockResolvedValue([]);

    const result = await filterSuppressedEmails(["charlie@test.com", "snoopy@test.com"]);

    expect(result.valid).toEqual(["charlie@test.com", "snoopy@test.com"]);
    expect(result.suppressed).toEqual([]);
  });

  it("queries by emailHash instead of email", async () => {
    mockPrisma.emailSuppression.findMany.mockResolvedValue([]);

    await filterSuppressedEmails(["test@test.com"]);

    expect(mockPrisma.emailSuppression.findMany).toHaveBeenCalledWith({
      where: { emailHash: { in: ["hash:test@test.com"] } },
      select: { emailHash: true },
    });
  });

  it("throws on database error", async () => {
    mockPrisma.emailSuppression.findMany.mockRejectedValue(new Error("Connection lost"));

    await expect(filterSuppressedEmails(["test@test.com"])).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});
