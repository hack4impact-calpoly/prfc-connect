import "server-only";
import { env } from "@/env";
import { sendSms } from "@/lib/sms";
import { AppError, transformError } from "@/utils/errors";
import { coopHourOfDay } from "@/utils/time";
import type { RecipientSendResult } from "@/types/message";

const SMS_BATCH_SIZE = 10;
const SMS_BATCH_DELAY_MS = 1000;

export function isQuietHours(): boolean {
  const hour = coopHourOfDay(new Date());
  return hour < 8 || hour >= 20;
}

export function validateSmsAllowed(): void {
  if (!env.SMS_ENABLED) {
    throw new AppError("FORBIDDEN", "SMS functionality is currently disabled", { reason: "SMS_DISABLED" });
  }

  if (isQuietHours()) {
    throw new AppError("FORBIDDEN", "SMS messages cannot be sent during quiet hours (8 PM - 8 AM Pacific)", {
      reason: "QUIET_HOURS",
    });
  }

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    throw new AppError("INTERNAL_ERROR", "SMS provider credentials are not configured");
  }
}

export async function sendGroupSms(params: {
  recipients: Array<{ phone: string; memberId: number }>;
  body: string;
}): Promise<{ sent: number; failed: number; results: RecipientSendResult[] }> {
  try {
    const { recipients, body } = params;

    if (recipients.length === 0) {
      return { sent: 0, failed: 0, results: [] };
    }

    let sent = 0;
    let failed = 0;
    const results: RecipientSendResult[] = [];

    for (let i = 0; i < recipients.length; i += SMS_BATCH_SIZE) {
      const batch = recipients.slice(i, i + SMS_BATCH_SIZE);

      const batchResults = await Promise.allSettled(batch.map((r) => sendSms(r.phone, body)));

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const recipient = batch[j];
        if (result.status === "fulfilled") {
          sent++;
          results.push({ memberId: recipient.memberId, status: "sent", externalId: result.value.sid });
        } else {
          failed++;
          const errorMsg = result.reason instanceof Error ? result.reason.message : "Unknown error";
          results.push({ memberId: recipient.memberId, status: "failed", error: errorMsg });
        }
      }

      if (i + SMS_BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, SMS_BATCH_DELAY_MS));
      }
    }

    return { sent, failed, results };
  } catch (error) {
    throw transformError(error);
  }
}
