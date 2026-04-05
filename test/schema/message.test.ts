import { BaseMessageSchema } from "@/schema/contact-group";

describe("BaseMessageSchema SMS body length", () => {
  it("allows long body when sendSms is false", () => {
    const result = BaseMessageSchema.safeParse({
      subject: "Test",
      body: "a".repeat(500),
      sendEmail: true,
      sendSms: false,
    });

    expect(result.success).toBe(true);
  });

  it("allows 160 character body when sendSms is true", () => {
    const result = BaseMessageSchema.safeParse({
      subject: "Test",
      body: "a".repeat(160),
      sendEmail: false,
      sendSms: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects body over 160 characters when sendSms is true", () => {
    const result = BaseMessageSchema.safeParse({
      subject: "Test",
      body: "a".repeat(161),
      sendEmail: false,
      sendSms: true,
    });

    expect(result.success).toBe(false);
  });

  it("allows long body when both channels enabled but sendSms is false", () => {
    const result = BaseMessageSchema.safeParse({
      subject: "Test",
      body: "a".repeat(500),
      sendEmail: true,
      sendSms: false,
    });

    expect(result.success).toBe(true);
  });
});
