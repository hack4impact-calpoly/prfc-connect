/**
 * @jest-environment node
 */
import { AppError, transformError, apiErrorHandler } from "@/utils/errors";
import { z } from "zod";

describe("AppError", () => {
  it("stores code, message, and context", () => {
    const err = new AppError("DATABASE_ERROR", "Query failed", {
      table: "referral",
    });

    expect(err.code).toBe("DATABASE_ERROR");
    expect(err.message).toBe("Query failed");
    expect(err.context).toEqual({ table: "referral" });
  });
});

describe("transformError", () => {
  it("passes through AppError unchanged", () => {
    const original = new AppError("NOT_FOUND", "Missing");
    expect(transformError(original)).toBe(original);
  });

  it("converts ZodError to VALIDATION_ERROR", () => {
    const schema = z.object({ email: z.email() });
    let caught: unknown;
    try {
      schema.parse({ email: "bad" });
    } catch (e) {
      caught = e;
    }

    const result = transformError(caught);

    expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("wraps unknown errors as INTERNAL_ERROR", () => {
    const result = transformError({ unexpected: true });

    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("apiErrorHandler", () => {
  const cases: Array<[string, number]> = [
    ["VALIDATION_ERROR", 400],
    ["NOT_FOUND", 404],
    ["UNAUTHORIZED", 401],
    ["DATABASE_ERROR", 500],
  ];

  it.each(cases)("%s maps to HTTP %i", (code, status) => {
    const err = new AppError(code as "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "DATABASE_ERROR", "msg");
    const res = apiErrorHandler(err);

    expect(res.status).toBe(status);
  });
});
