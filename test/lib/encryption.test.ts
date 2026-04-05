const mockEnv = vi.hoisted(() => ({
  FIELD_ENCRYPTION_KEY: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  BLIND_INDEX_KEY: "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
}));

vi.mock("@/env", () => ({
  env: mockEnv,
}));

import { encrypt, decrypt, blindIndex } from "@/lib/encryption";

describe("encrypt and decrypt", () => {
  it("round-trips plaintext correctly", () => {
    const plaintext = "jane.doe@example.com";
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("produces different ciphertext for the same input", () => {
    const plaintext = "same-input";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const ciphertext = encrypt("");
    expect(decrypt(ciphertext)).toBe("");
  });

  it("handles long strings", () => {
    const plaintext = "a".repeat(500);
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("handles unicode characters", () => {
    const plaintext = "Maria Garcia-Lopez";
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("throws on tampered ciphertext", () => {
    const ciphertext = encrypt("test");
    const tampered = ciphertext.slice(0, -2) + "xx";
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws on invalid base64url input", () => {
    expect(() => decrypt("not-valid-ciphertext")).toThrow();
  });

  it("produces base64url-encoded output", () => {
    const ciphertext = encrypt("test");
    expect(ciphertext).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("blindIndex", () => {
  it("produces a 64-character hex string", () => {
    const hash = blindIndex("test@example.com");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    const a = blindIndex("test@example.com");
    const b = blindIndex("test@example.com");
    expect(a).toBe(b);
  });

  it("is case-insensitive", () => {
    const lower = blindIndex("test@example.com");
    const upper = blindIndex("TEST@EXAMPLE.COM");
    const mixed = blindIndex("Test@Example.COM");
    expect(lower).toBe(upper);
    expect(lower).toBe(mixed);
  });

  it("produces different hashes for different inputs", () => {
    const a = blindIndex("alice@example.com");
    const b = blindIndex("bob@example.com");
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const hash = blindIndex("");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
