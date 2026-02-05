import { prismaMock } from "../mocks/prisma";
import { suppressedLucy, suppressedMarcie } from "../mocks/email-suppressions";
import { isEmailSuppressed, suppressEmail, filterSuppressedEmails } from "@/services/email";

describe("isEmailSuppressed", () => {
  it("returns true when email exists in suppression list", async () => {
    prismaMock.emailSuppression.findUnique.mockResolvedValue(suppressedLucy);

    const result = await isEmailSuppressed("lucy@yahoo.com");

    expect(result).toBe(true);
  });

  it("returns false when email not found", async () => {
    prismaMock.emailSuppression.findUnique.mockResolvedValue(null);

    const result = await isEmailSuppressed("charlie@test.com");

    expect(result).toBe(false);
  });

  it("normalizes email to lowercase for lookup", async () => {
    prismaMock.emailSuppression.findUnique.mockResolvedValue(suppressedLucy);

    await isEmailSuppressed("LUCY@YAHOO.COM");

    expect(prismaMock.emailSuppression.findUnique).toHaveBeenCalledWith({
      where: { email: "lucy@yahoo.com" },
    });
  });
});

describe("suppressEmail", () => {
  it("creates suppression record with reason", async () => {
    prismaMock.emailSuppression.upsert.mockResolvedValue(suppressedLucy);

    await suppressEmail("lucy@yahoo.com", "hard_bounce");

    expect(prismaMock.emailSuppression.upsert).toHaveBeenCalledWith({
      where: { email: "lucy@yahoo.com" },
      update: { reason: "hard_bounce", suppressedAt: expect.any(Date) },
      create: { email: "lucy@yahoo.com", reason: "hard_bounce" },
    });
  });

  it("normalizes email to lowercase before storage", async () => {
    prismaMock.emailSuppression.upsert.mockResolvedValue(suppressedLucy);

    await suppressEmail("LUCY@YAHOO.COM", "complaint");

    expect(prismaMock.emailSuppression.upsert).toHaveBeenCalledWith({
      where: { email: "lucy@yahoo.com" },
      update: { reason: "complaint", suppressedAt: expect.any(Date) },
      create: { email: "lucy@yahoo.com", reason: "complaint" },
    });
  });
});

describe("filterSuppressedEmails", () => {
  it("separates suppressed from valid emails", async () => {
    prismaMock.emailSuppression.findMany.mockResolvedValue([suppressedLucy, suppressedMarcie]);

    const result = await filterSuppressedEmails([
      "charlie@test.com",
      "lucy@yahoo.com",
      "marcie@gmail.com",
      "snoopy@test.com",
    ]);

    expect(result.valid).toEqual(["charlie@test.com", "snoopy@test.com"]);
    expect(result.suppressed).toEqual(["lucy@yahoo.com", "marcie@gmail.com"]);
  });

  it("handles case-insensitive matching", async () => {
    prismaMock.emailSuppression.findMany.mockResolvedValue([suppressedLucy]);

    const result = await filterSuppressedEmails(["LUCY@YAHOO.COM", "charlie@test.com"]);

    expect(result.valid).toEqual(["charlie@test.com"]);
    expect(result.suppressed).toEqual(["LUCY@YAHOO.COM"]);
  });

  it("returns empty arrays for empty input", async () => {
    prismaMock.emailSuppression.findMany.mockResolvedValue([]);

    const result = await filterSuppressedEmails([]);

    expect(result.valid).toEqual([]);
    expect(result.suppressed).toEqual([]);
  });

  it("returns all emails as valid when none suppressed", async () => {
    prismaMock.emailSuppression.findMany.mockResolvedValue([]);

    const result = await filterSuppressedEmails(["charlie@test.com", "snoopy@test.com"]);

    expect(result.valid).toEqual(["charlie@test.com", "snoopy@test.com"]);
    expect(result.suppressed).toEqual([]);
  });

  it("throws on database error", async () => {
    prismaMock.emailSuppression.findMany.mockRejectedValue(new Error("Connection lost"));

    await expect(filterSuppressedEmails(["test@test.com"])).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});
