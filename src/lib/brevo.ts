import "server-only";
import { env } from "@/env";
import { AppError } from "@/utils/errors";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export interface BrevoEmailPayload {
  sender: { name?: string; email: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  replyTo?: { email: string };
  headers?: Record<string, string>;
}

export async function sendBrevoEmail(payload: BrevoEmailPayload): Promise<string> {
  const apiKey = env.BREVO_API_KEY;
  if (!apiKey) {
    throw new AppError("INTERNAL_ERROR", "Brevo API key is not configured");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      code: "unknown",
      message: `HTTP ${response.status}`,
    }));
    throw new AppError("EMAIL_ERROR", `Email send failed: ${error.code} - ${error.message}`);
  }

  const data: { messageId: string } = await response.json();
  return data.messageId;
}
