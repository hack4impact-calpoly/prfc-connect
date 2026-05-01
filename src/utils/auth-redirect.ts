export function handleActionError(
  error: string | undefined,
  fallback: string = "An unexpected error occurred",
): string {
  if (error === "Authentication required" || error === "Invalid or expired token") {
    window.location.href = "/unauthorized";
    return "";
  }
  return error ?? fallback;
}
