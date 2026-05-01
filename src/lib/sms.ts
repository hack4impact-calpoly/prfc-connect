import "server-only";
import twilio, { validateRequest } from "twilio";
import { env } from "@/env";
import { AppError } from "@/utils/errors";

let _client: ReturnType<typeof twilio> | null = null;

function getClient(): ReturnType<typeof twilio> {
  if (_client) return _client;
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    throw new AppError("INTERNAL_ERROR", "Twilio credentials are not configured");
  }
  _client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return _client;
}

export function verifyTwilioSignature(signature: string, url: string, params: Record<string, string>): boolean {
  if (!env.TWILIO_AUTH_TOKEN) return false;
  return validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
}

export async function sendSms(to: string, body: string): Promise<{ sid: string }> {
  if (!env.TWILIO_FROM_NUMBER) {
    throw new AppError("INTERNAL_ERROR", "Twilio from number is not configured");
  }
  const client = getClient();
  const message = await client.messages.create({
    to,
    from: env.TWILIO_FROM_NUMBER,
    body,
  });
  return { sid: message.sid };
}
