const SESSION_EXPIRED_ERRORS = new Set([
  "Authentication required",
  "Invalid or expired token",
  "Member portal session required",
]);

export function handleActionError(
  error: string | undefined,
  fallback: string = "An unexpected error occurred",
): string {
  if (error !== undefined && SESSION_EXPIRED_ERRORS.has(error)) {
    window.location.href = "/unauthorized";
    return "";
  }
  return error ?? fallback;
}
