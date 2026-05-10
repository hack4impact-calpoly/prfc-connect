import "server-only";
import crypto from "crypto";
import { env } from "@/env";
import type { TokenVerificationResult, EmailTokenVerificationResult } from "@/types/unsubscribe";

export type { TokenVerificationResult, EmailTokenVerificationResult } from "@/types/unsubscribe";

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

export function generateUnsubscribeToken(memberId: number, groupId: number): string {
  const timestamp = Date.now();
  const payload = `${memberId}|${groupId}|${timestamp}`;

  const signature = crypto.createHmac("sha256", env.UNSUBSCRIBE_SECRET).update(payload).digest("base64url");

  return Buffer.from(`${payload}|${signature}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): TokenVerificationResult {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split("|");

    if (parts.length !== 4) {
      return { valid: false, error: "Invalid token format" };
    }

    const [memberIdStr, groupIdStr, timestampStr, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", env.UNSUBSCRIBE_SECRET)
      .update(`${memberIdStr}|${groupIdStr}|${timestampStr}`)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: "Invalid signature" };
    }

    const memberId = parseInt(memberIdStr, 10);
    const groupId = parseInt(groupIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    if (Number.isNaN(memberId) || Number.isNaN(groupId) || Number.isNaN(timestamp)) {
      return { valid: false, error: "Invalid token format" };
    }

    const tokenAge = Date.now() - timestamp;

    if (tokenAge > TEN_YEARS_MS) {
      return { valid: false, error: "Token expired" };
    }

    return {
      valid: true,
      memberId,
      groupId,
      timestamp,
    };
  } catch {
    return { valid: false, error: "Token parsing failed" };
  }
}

const EMAIL_MARKER = "referral";

export function generateEmailUnsubscribeToken(email: string): string {
  const timestamp = Date.now();
  const payload = `${email}|${EMAIL_MARKER}|${timestamp}`;

  const signature = crypto.createHmac("sha256", env.UNSUBSCRIBE_SECRET).update(payload).digest("base64url");

  const token = Buffer.from(`${payload}|${signature}`).toString("base64url");
  return token;
}

export function verifyEmailUnsubscribeToken(token: string): EmailTokenVerificationResult {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split("|");

    if (parts.length !== 4 || parts[1] !== EMAIL_MARKER) {
      return { valid: false, error: "Invalid token format" };
    }

    const [email, , timestampStr, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", env.UNSUBSCRIBE_SECRET)
      .update(`${email}|${EMAIL_MARKER}|${timestampStr}`)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: "Invalid signature" };
    }

    const timestamp = parseInt(timestampStr, 10);

    if (Number.isNaN(timestamp)) {
      return { valid: false, error: "Invalid token format" };
    }

    const tokenAge = Date.now() - timestamp;

    if (tokenAge > TEN_YEARS_MS) {
      return { valid: false, error: "Token expired" };
    }

    return { valid: true, email, timestamp };
  } catch {
    return { valid: false, error: "Token parsing failed" };
  }
}
