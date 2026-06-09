import { describe, it, expect, beforeEach } from "vitest";
import { handleActionError } from "@/utils/auth-redirect";

describe("handleActionError", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "" },
    });
  });

  it("redirects to /unauthorized on session-expired errors", () => {
    for (const message of ["Authentication required", "Invalid or expired token", "Member portal session required"]) {
      window.location.href = "";
      const result = handleActionError(message);
      expect(window.location.href).toBe("/unauthorized");
      expect(result).toBe("");
    }
  });

  it("returns the message for ordinary errors without redirecting", () => {
    const result = handleActionError("Something went wrong");

    expect(result).toBe("Something went wrong");
    expect(window.location.href).toBe("");
  });

  it("returns the fallback when the error is undefined", () => {
    const result = handleActionError(undefined, "fallback message");

    expect(result).toBe("fallback message");
    expect(window.location.href).toBe("");
  });
});
