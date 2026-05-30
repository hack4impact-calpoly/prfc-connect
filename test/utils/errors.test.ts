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

  it("returns only code and message in response body, no stack trace", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("Something broke internally");
    const res = apiErrorHandler(err);
    const body = await res.json();

    expect(body).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something broke internally",
      },
    });
    expect(body.error).not.toHaveProperty("stack");
    expect(body).not.toHaveProperty("stack");
    spy.mockRestore();
  });

  it("transforms Prisma errors to generic message in response body", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { Prisma } = await import("@/generated/prisma/client");
    const prismaErr = new Prisma.PrismaClientKnownRequestError("Column 'email' not found", {
      code: "P2022",
      clientVersion: "7.0.0",
    });
    const res = apiErrorHandler(prismaErr);
    const body = await res.json();

    expect(body.error.message).toBe("Database operation failed");
    expect(body.error.message).not.toContain("Column");
    expect(body.error.message).not.toContain("email");
    spy.mockRestore();
  });
});
