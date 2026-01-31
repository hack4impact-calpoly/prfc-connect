import { z } from "zod";

export const ErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "DATABASE_ERROR",
  "EMAIL_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INTERNAL_ERROR",
  "RATE_LIMITED",
  "GROUP_NOT_FOUND",
  "GROUP_ACCESS_DENIED",
  "MEMBER_ALREADY_IN_GROUP",
  "MEMBER_NOT_IN_GROUP",
  "INVALID_MEMBER_ID",
  "SMS_CONSENT_REQUIRED",
  "MESSAGE_SEND_FAILED",
  "BLAST_NOT_AUTHORIZED",
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
