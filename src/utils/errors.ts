import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { ErrorCode } from "@/schema/error";

export type { ErrorCode } from "@/schema/error";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorStatusMap: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  DATABASE_ERROR: 500,
  EMAIL_ERROR: 500,
  INTERNAL_ERROR: 500,
};

export function transformError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    const messages = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return new AppError("VALIDATION_ERROR", messages.join(", "), {
      issues: error.issues,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return new AppError("NOT_FOUND", "Record not found", {
        prismaCode: error.code,
      });
    }
    return new AppError("DATABASE_ERROR", "Database operation failed", {
      prismaCode: error.code,
    });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError("VALIDATION_ERROR", "Invalid data provided");
  }

  if (error instanceof Error) {
    return new AppError("INTERNAL_ERROR", error.message);
  }

  if (typeof error === "string") {
    return new AppError("INTERNAL_ERROR", error);
  }

  return new AppError("INTERNAL_ERROR", "An unexpected error occurred");
}

export function apiErrorHandler(error: unknown): NextResponse {
  const appError = transformError(error);

  console.error(`[${appError.code}] ${appError.message}`, appError.context);

  return NextResponse.json(
    { error: { code: appError.code, message: appError.message } },
    { status: errorStatusMap[appError.code] },
  );
}
