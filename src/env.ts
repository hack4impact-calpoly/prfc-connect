import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),

  RESEND_API_KEY: z.string().min(1).optional(),
  FROM_EMAIL: z.email().optional(),

  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Shared secret for HMAC token validation with PRFC portal
  PRFC_PORTAL_SECRET: z.string().min(32).optional(),

  // SMS feature flag (disabled by default)
  EMAIL_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  EMAIL_REDIRECT_TO: z.email().optional(),

  SMS_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_FROM_NUMBER: z.string().min(1).optional(),

  STAGING: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  STAGING_USERNAME: z.string().min(1).optional(),
  STAGING_PASSWORD: z.string().min(1).optional(),

  // Member Portal API integration toggle
  USE_MOCK_MEMBER_API: z
    .string()
    .default("true")
    .transform((v) => v === "true"),

  // Unsubscribe token signing secret (256-bit minimum)
  UNSUBSCRIBE_SECRET: z.string().min(32),

  FIELD_ENCRYPTION_KEY: z
    .string()
    .length(64)
    .regex(/^[0-9a-f]+$/i),
  BLIND_INDEX_KEY: z
    .string()
    .length(64)
    .regex(/^[0-9a-f]+$/i),

  // Application base URL for generating unsubscribe links
  APP_URL: z.url().default("http://localhost:3000"),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const skipValidation = process.env.CI === "true";

export const env = skipValidation
  ? (process.env as unknown as z.infer<typeof envSchema>)
  : envSchema.parse(process.env);
