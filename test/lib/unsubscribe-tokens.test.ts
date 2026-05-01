import { vi } from "vitest";

vi.mock("@/env", () => ({
  env: {
    UNSUBSCRIBE_SECRET: "test-secret-key-must-be-at-least-32-chars",
  },
}));

import { generateUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe-tokens";

describe("unsubscribe token round-trip", () => {
  it("generates and verifies a valid token", () => {
    const token = generateUnsubscribeToken(100001, 5);
    const result = verifyUnsubscribeToken(token);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.memberId).toBe(100001);
      expect(result.groupId).toBe(5);
    }
  });

  it("rejects tampered memberId", () => {
    const token = generateUnsubscribeToken(100001, 5);
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split("|");
    parts[0] = "999999";
    const tampered = Buffer.from(parts.join("|")).toString("base64url");

    const result = verifyUnsubscribeToken(tampered);
    expect(result.valid).toBe(false);
  });

  it("rejects tampered groupId", () => {
    const token = generateUnsubscribeToken(100001, 5);
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split("|");
    parts[1] = "999";
    const tampered = Buffer.from(parts.join("|")).toString("base64url");

    const result = verifyUnsubscribeToken(tampered);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid base64", () => {
    const result = verifyUnsubscribeToken("not-valid!!!");
    expect(result.valid).toBe(false);
  });

  it("rejects token with wrong number of parts", () => {
    const malformed = Buffer.from("only|two").toString("base64url");
    const result = verifyUnsubscribeToken(malformed);
    expect(result.valid).toBe(false);
  });

  it("rejects token with non-numeric memberId", () => {
    const malformed = Buffer.from("abc|5|12345|fakesig").toString("base64url");
    const result = verifyUnsubscribeToken(malformed);
    expect(result.valid).toBe(false);
  });

  it("handles signature length mismatch without crashing", () => {
    const malformed = Buffer.from("100001|5|12345|short").toString("base64url");
    const result = verifyUnsubscribeToken(malformed);
    expect(result.valid).toBe(false);
  });
});
