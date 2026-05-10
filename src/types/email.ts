export interface BrevoEmailPayload {
  sender: { name?: string; email: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: { email: string };
  headers?: Record<string, string>;
}
