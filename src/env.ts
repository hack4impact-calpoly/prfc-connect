function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string): string | undefined {
  return process.env[key];
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  DATABASE_PASSWORD: required("DATABASE_PASSWORD"),

  SMTP_HOST: required("SMTP_HOST"),
  SMTP_PORT: optional("SMTP_PORT") ?? "587",
  SMTP_SECURE: optional("SMTP_SECURE") === "true",
  SMTP_USER: required("SMTP_USER"),
  SMTP_PASS: required("SMTP_PASS"),
  FROM_EMAIL: required("FROM_EMAIL"),

  UPSTASH_REDIS_REST_URL: optional("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: optional("UPSTASH_REDIS_REST_TOKEN"),

  NODE_ENV: optional("NODE_ENV") ?? "development",
} as const;
