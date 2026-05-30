import { envSchema } from "@/env";

const validBaseEnv = {
  DATABASE_URL: "mysql://user:pass@127.0.0.1:3306/db",
  UNSUBSCRIBE_SECRET: "u".repeat(32),
  FIELD_ENCRYPTION_KEY: "a".repeat(64),
  BLIND_INDEX_KEY: "b".repeat(64),
};

describe("envSchema production Redis requirement", () => {
  it("rejects production without UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN", () => {
    const result = envSchema.safeParse({
      ...validBaseEnv,
      NODE_ENV: "production",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(
        messages.some((m) =>
          m.includes("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production"),
        ),
      ).toBe(true);
    }
  });

  it("rejects production with only UPSTASH_REDIS_REST_URL set", () => {
    const result = envSchema.safeParse({
      ...validBaseEnv,
      NODE_ENV: "production",
      UPSTASH_REDIS_REST_URL: "https://fake.upstash.io",
    });

    expect(result.success).toBe(false);
  });

  it("rejects production with only UPSTASH_REDIS_REST_TOKEN set", () => {
    const result = envSchema.safeParse({
      ...validBaseEnv,
      NODE_ENV: "production",
      UPSTASH_REDIS_REST_TOKEN: "fake-token",
    });

    expect(result.success).toBe(false);
  });

  it("accepts production with both UPSTASH_REDIS env vars set", () => {
    const result = envSchema.safeParse({
      ...validBaseEnv,
      NODE_ENV: "production",
      UPSTASH_REDIS_REST_URL: "https://fake.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "fake-token",
    });

    expect(result.success).toBe(true);
  });

  it("accepts development without Redis env vars", () => {
    const result = envSchema.safeParse({
      ...validBaseEnv,
      NODE_ENV: "development",
    });

    expect(result.success).toBe(true);
  });

  it("accepts test without Redis env vars", () => {
    const result = envSchema.safeParse({
      ...validBaseEnv,
      NODE_ENV: "test",
    });

    expect(result.success).toBe(true);
  });
});
