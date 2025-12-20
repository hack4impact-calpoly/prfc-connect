import { z } from "zod";

export const ErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "DATABASE_ERROR",
  "EMAIL_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INTERNAL_ERROR",
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
