import { z } from "zod";

export const envSchema = z
  .object({
    DATABASE_URL: z.url(),

    BREVO_API_KEY: z.string().min(1).optional(),
    FROM_EMAIL: z.email().optional(),
    DAILY_EMAIL_LIMIT: z.coerce.number().int().positive().default(300),

    // Shared secret for HMAC token validation with PRFC portal
    PRFC_PORTAL_SECRET: z.string().min(32).optional(),

    PRFC_PORTAL_LOGIN_URL: z.url().optional(),

    // Member Portal API: the PHP actions endpoint and the service secret for getmembercontacts
    PRFC_PORTAL_API_URL: z.url().optional(),
    MEMBER_API_SECRET: z.string().min(1).optional(),

    // SMS feature flag (disabled by default)
    EMAIL_ENABLED: z
      .string()
      .default("false")
      .transform((v) => v === "true"),

    SMS_ENABLED: z
      .string()
      .default("false")
      .transform((v) => v === "true"),

    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_FROM_NUMBER: z.string().min(1).optional(),

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

    CRON_SECRET: z.string().min(1).optional(),

    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  })
  .superRefine((parsed, ctx) => {
    if (!parsed.USE_MOCK_MEMBER_API && (!parsed.PRFC_PORTAL_API_URL || !parsed.MEMBER_API_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: ["PRFC_PORTAL_API_URL"],
        message: "PRFC_PORTAL_API_URL and MEMBER_API_SECRET are required when USE_MOCK_MEMBER_API is false",
      });
    }

    if (parsed.EMAIL_ENABLED && (!parsed.BREVO_API_KEY || !parsed.FROM_EMAIL)) {
      ctx.addIssue({
        code: "custom",
        path: ["BREVO_API_KEY"],
        message: "BREVO_API_KEY and FROM_EMAIL are required when EMAIL_ENABLED is true",
      });
    }

    if (parsed.SMS_ENABLED && (!parsed.TWILIO_ACCOUNT_SID || !parsed.TWILIO_AUTH_TOKEN || !parsed.TWILIO_FROM_NUMBER)) {
      ctx.addIssue({
        code: "custom",
        path: ["TWILIO_ACCOUNT_SID"],
        message: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are required when SMS_ENABLED is true",
      });
    }
  });

const skipValidation = process.env.CI === "true";

export const env = skipValidation
  ? (process.env as unknown as z.infer<typeof envSchema>)
  : envSchema.parse(process.env);
