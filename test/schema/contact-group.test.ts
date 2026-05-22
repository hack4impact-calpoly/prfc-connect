import { CreateContactGroupSchema, ComposeMessageSchema } from "@/schema/contact-group";

describe("CreateContactGroupSchema", () => {
  it("strips unknown fields from parsed output", () => {
    const input = {
      name: "Test Group",
      description: null,
      memberIds: [100001],
      isAdmin: true,
      ownerid: 999,
      __proto_pollution: "malicious",
    };

    const result = CreateContactGroupSchema.parse(input);

    expect(result).toEqual({
      name: "Test Group",
      description: null,
      memberIds: [100001],
    });
    expect(result).not.toHaveProperty("isAdmin");
    expect(result).not.toHaveProperty("ownerid");
    expect(result).not.toHaveProperty("__proto_pollution");
  });
});

describe("ComposeMessageSchema", () => {
  it("strips unknown fields from parsed output", () => {
    const input = {
      groupIds: [1],
      subject: "Hello",
      body: "Body text",
      sendEmail: true,
      sendSms: false,
      recipientOverride: [999],
      isAdmin: true,
    };

    const result = ComposeMessageSchema.parse(input);

    expect(result).not.toHaveProperty("recipientOverride");
    expect(result).not.toHaveProperty("isAdmin");
  });
});
