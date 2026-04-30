import { BaseMessageSchema } from "@/schema/contact-group";
import { MessageHistoryQuerySchema } from "@/schema/message";

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

describe("MessageHistoryQuerySchema", () => {
  it("accepts valid full input", () => {
    const result = MessageHistoryQuerySchema.safeParse({
      search: "hello",
      channel: "email",
      sort: "recent",
      cursor: 42,
      direction: "forward",
      pageSize: 25,
    });

    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = MessageHistoryQuerySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("rejects invalid pageSize", () => {
    const result = MessageHistoryQuerySchema.safeParse({ pageSize: 30 });

    expect(result.success).toBe(false);
  });

  it("rejects invalid channel value", () => {
    const result = MessageHistoryQuerySchema.safeParse({ channel: "push" });

    expect(result.success).toBe(false);
  });

  it("rejects invalid sort value", () => {
    const result = MessageHistoryQuerySchema.safeParse({ sort: "alphabetical" });

    expect(result.success).toBe(false);
  });
});
