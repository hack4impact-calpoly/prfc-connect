import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  FROM_EMAIL: z.email(),

  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Shared secret for HMAC token validation with PRFC portal
  PRFC_PORTAL_SECRET: z.string().min(32).optional(),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const skipValidation = process.env.CI === "true";

export const env = skipValidation
  ? (process.env as unknown as z.infer<typeof envSchema>)
  : envSchema.parse(process.env);
