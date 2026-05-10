import { vi } from "vitest";

vi.mock("@/env", () => ({
  env: {
    UNSUBSCRIBE_SECRET: "test-secret-key-must-be-at-least-32-chars",
  },
}));

import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  generateEmailUnsubscribeToken,
  verifyEmailUnsubscribeToken,
} from "@/lib/unsubscribe-tokens";

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

describe("email unsubscribe token round-trip", () => {
  it("generates and verifies a valid referral token", () => {
    const token = generateEmailUnsubscribeToken("prospect@example.com");
    const result = verifyEmailUnsubscribeToken(token);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.email).toBe("prospect@example.com");
      expect(result.timestamp).toBeGreaterThan(0);
    }
  });

  it("rejects tampered email", () => {
    const token = generateEmailUnsubscribeToken("original@example.com");
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split("|");
    parts[0] = "attacker@evil.com";
    const tampered = Buffer.from(parts.join("|")).toString("base64url");

    const result = verifyEmailUnsubscribeToken(tampered);
    expect(result.valid).toBe(false);
  });

  it("rejects member token format", () => {
    const memberToken = generateUnsubscribeToken(100001, 5);
    const result = verifyEmailUnsubscribeToken(memberToken);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid base64", () => {
    const result = verifyEmailUnsubscribeToken("garbage!!!");
    expect(result.valid).toBe(false);
  });

  it("rejects token with wrong marker", () => {
    const malformed = Buffer.from("test@example.com|wrongmarker|12345|fakesig").toString("base64url");
    const result = verifyEmailUnsubscribeToken(malformed);
    expect(result.valid).toBe(false);
  });

  it("member verify rejects referral token format", () => {
    const referralToken = generateEmailUnsubscribeToken("test@example.com");
    const result = verifyUnsubscribeToken(referralToken);
    expect(result.valid).toBe(false);
  });
});
