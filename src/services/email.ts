import "server-only";
import prisma from "@/lib/db";
import type { Prospect } from "@/schema/referral";
import { AppError } from "@/utils/errors";
import { escapeHtml, plaintextToHtml } from "@/utils/html";
import type { EmailRecipient, RecipientSendResult } from "@/types/message";
import { env } from "@/env";
import { sendBrevoEmail } from "@/lib/brevo";
import { generateEmailUnsubscribeToken } from "@/lib/unsubscribe-tokens";
import { filterSuppressedEmails, isEmailSuppressed } from "./email-suppression";

export function validateEmailAllowed(): void {
  if (!env.EMAIL_ENABLED) {
    throw new AppError("FORBIDDEN", "Email functionality is currently disabled", { reason: "EMAIL_DISABLED" });
  }
  if (!env.BREVO_API_KEY) {
    throw new AppError("INTERNAL_ERROR", "Email provider API key is not configured");
  }
}

export async function getDailyEmailCount(): Promise<number> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  return prisma.messageRecipient.count({
    where: {
      channel: "email",
      status: "sent",
      sentAt: { gte: todayStart },
    },
  });
}
interface SendReferralEmailParams {
  prospects: Prospect[];
  referralCode: string;
  memberName: string;
}

export async function sendReferralEmails({
  prospects,
  referralCode,
  memberName,
}: SendReferralEmailParams): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;

  try {
    for (const prospect of prospects) {
      const suppressed = await isEmailSuppressed(prospect.prospectEmail);
      if (suppressed) {
        skipped++;
        continue;
      }

      const subject = "You've Been Invited!";
      const unsubscribeToken = generateEmailUnsubscribeToken(prospect.prospectEmail);
      const unsubscribeUrl = `${env.APP_URL}/unsubscribe?token=${unsubscribeToken}`;
      const unsubscribeApiUrl = `${env.APP_URL}/api/unsubscribe?token=${unsubscribeToken}`;

      const joinUrl = `https://www.pasofoodcooperative.com/join-now1.html?enterReferral=${referralCode}`;
      const textContent = `Hello ${prospect.prospectName},\n\nWe're excited to let you know that ${memberName}, thinks you'd love being a part of the Paso Robles Food Co-op!\n\nAt the Co-op, we're all about building a stronger community by connecting members to fresh, healthy, and locally-sourced food. As a member owner, you'll enjoy:\n\n- Supporting local farmers and food producers 🌱\n- A say in how the Co-op operates (yes, you're an owner!) 🗳️\n- Exclusive discounts and special events 🎉\n\nIt's easy to join the Co-op and start making an impact in our community! Just click the link below to complete your membership registration:\n\n👉 Join Now: ${joinUrl}\n\nYour referral code is ${referralCode}—be sure to confirm/enter it during registration.\n\nFeel free to reach out if you have any questions or want to learn more about what makes the Paso Robles Food Co-op special. Our monthly meeting is every 4th Wednesday at 6pm. All details and info at our website: www.pasofoodcooperative.com\n\nLooking forward to welcoming you into our growing Co-op family!\n\nWarm regards,\n${memberName} and The Paso Robles Food Co-op Member Owners\n\n📧 info@pasofoodcooperative.com\n🌐 www.pasofoodcooperative.com\n\n---\nThis email was sent on behalf of a Co-op member who thought you might be interested.\nPaso Robles Food Cooperative, Inc. P.O. Box 922, Paso Robles, CA 93447\nUnsubscribe: ${unsubscribeUrl}`;

      await sendBrevoEmail({
        sender: { name: "Paso Robles Food Co-op", email: env.FROM_EMAIL ?? "noreply@example.com" },
        to: [{ email: prospect.prospectEmail }],
        subject,
        htmlContent: generateReferralEmailHtml(prospect.prospectName, memberName, referralCode, unsubscribeUrl),
        textContent,
        headers: {
          "List-Unsubscribe": `<${unsubscribeApiUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      sent++;
    }

    return { sent, skipped };
  } catch (error) {
    throw new AppError("EMAIL_ERROR", "Failed to send referral emails", {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

export function generateReferralEmailHtml(
  prospectName: string,
  memberName: string,
  referralCode: string,
  unsubscribeUrl: string,
): string {
  const logoUrl = `${env.APP_URL}/assets/logo-white.png`;
  const safeName = escapeHtml(prospectName);
  const safeMember = escapeHtml(memberName);
  const safeCode = escapeHtml(referralCode);
  const joinUrl = `https://www.pasofoodcooperative.com/join-now1.html?enterReferral=${safeCode}`;
  const font = "font-family: Arial, Helvetica, sans-serif;";
  const textColor = "color: #333333;";
  const cellStyle = `${font} font-size: 16px; line-height: 1.5; ${textColor}`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; background-color: #ffffff;">
        <tr>
          <td align="center" style="padding: 24px 0;">
            <img src="${logoUrl}" alt="Paso Robles Food Co-op" width="200" height="auto" style="display: block; width: 200px; max-width: 100%; border: 0;">
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 16px; ${cellStyle}">
            Hello ${safeName},
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 16px; ${cellStyle}">
            We're excited to let you know that <strong>${safeMember}</strong>, thinks you'd love being a part of the Paso Robles Food Co-op!
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 8px; ${cellStyle}">
            At the Co-op, we're all about building a stronger community by connecting members to fresh, healthy, and locally-sourced food. As a member owner, you'll enjoy:
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 16px; ${cellStyle}">
            &bull; Supporting local farmers and food producers 🌱<br>
            &bull; A say in how the Co-op operates (yes, you're an owner!) 🗳️<br>
            &bull; Exclusive discounts and special events 🎉
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 24px; ${cellStyle}">
            It's easy to join the Co-op and start making an impact in our community! Just click the link below to complete your membership registration:
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0 24px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="#831002" style="background-color: #831002; border-radius: 6px;">
                  <a href="${joinUrl}" style="${font} font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 32px;">Join Now</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 16px; ${cellStyle}">
            Your referral code is <strong>${safeCode}</strong>—be sure to confirm/enter it during registration.
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 16px; ${cellStyle}">
            Feel free to reach out if you have any questions or want to learn more about what makes the Paso Robles Food Co-op special. Our monthly meeting is every 4th Wednesday at 6pm. All details and info at our website: <a href="https://www.pasofoodcooperative.com" style="color: #831002;">www.pasofoodcooperative.com</a>.
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 24px; ${cellStyle}">
            Looking forward to welcoming you into our growing Co-op family!<br><br>
            Warm regards,<br>
            ${safeMember} and The Paso Robles Food Co-op Member Owners
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px; border-top: 1px solid #dddddd;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding: 8px 24px 16px; ${font} font-size: 12px; line-height: 1.5; color: #888888;">
            📧 info@pasofoodcooperative.com<br>
            🌐 www.pasofoodcooperative.com<br>
            This email was sent on behalf of a Co-op member who thought you might be interested.<br>
            Paso Robles Food Cooperative, Inc. P.O. Box 922, Paso Robles, CA 93447<br>
            <a href="${unsubscribeUrl}" style="color: #831002;">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function wrapInEmailTemplate(bodyHtml: string, footerHtml: string): string {
  const font = "font-family: Arial, Helvetica, sans-serif;";
  const cellStyle = `${font} font-size: 16px; line-height: 1.5; color: #333333;`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 600px; background-color: #ffffff;">
        <tr>
          <td style="padding: 24px; ${cellStyle}">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px; border-top: 1px solid #dddddd;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding: 8px 24px 16px; ${font} font-size: 12px; line-height: 1.5; color: #888888;">
            ${footerHtml}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

const BATCH_SIZE = 25;

export type { EmailRecipient as Recipient } from "@/types/message";

interface GroupEmailParams {
  recipients: Array<EmailRecipient>;
  subject: string;
  body: string;
  senderName: string;
  replyTo: string;
}

export async function sendGroupEmails(
  params: GroupEmailParams,
): Promise<{ sent: number; failed: number; suppressed: number; results: RecipientSendResult[] }> {
  const { recipients, subject, body, senderName, replyTo } = params;

  const emails = recipients.map((r) => r.email);
  const { valid, suppressed } = await filterSuppressedEmails(emails);
  const validRecipients = recipients.filter((r) => valid.includes(r.email));

  let sent = 0;
  let failed = 0;
  const recipientResults: RecipientSendResult[] = [];

  for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
    const batch = validRecipients.slice(i, i + BATCH_SIZE);

    const bodyHtml = plaintextToHtml(body);
    const plainBody = body;

    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        const token = generateEmailUnsubscribeToken(recipient.email);
        const unsubscribeUrl = `${env.APP_URL}/unsubscribe?token=${token}`;
        const unsubscribeApiUrl = `${env.APP_URL}/api/unsubscribe?token=${token}`;

        const footerHtml = `<strong>Paso Robles Food Cooperative, Inc.</strong><br>
            P.O. Box 922, Paso Robles, CA 93447<br>
            <a href="${unsubscribeUrl}" style="color: #831002;">Unsubscribe</a>`;

        const htmlContent = wrapInEmailTemplate(bodyHtml, footerHtml);

        const textContent = `${plainBody}\n\n---\nPaso Robles Food Cooperative, Inc.\nP.O. Box 922, Paso Robles, CA 93447\nUnsubscribe: ${unsubscribeUrl}`;

        const result = await sendBrevoEmail({
          sender: { name: senderName, email: env.FROM_EMAIL ?? "" },
          to: [{ email: recipient.email }],
          replyTo: { email: replyTo },
          subject,
          htmlContent,
          textContent,
          headers: {
            "List-Unsubscribe": `<${unsubscribeApiUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        return { memberId: recipient.memberId, externalId: result.messageId };
      }),
    );

    let quotaExhausted = false;
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const recipient = batch[j];
      if (result.status === "fulfilled") {
        sent++;
        recipientResults.push({ memberId: recipient.memberId, status: "sent", externalId: result.value.externalId });
      } else {
        const isQuotaError = result.reason instanceof AppError && result.reason.code === "QUOTA_EXCEEDED";
        if (isQuotaError) {
          quotaExhausted = true;
          recipientResults.push({ memberId: recipient.memberId, status: "queued" });
        } else {
          failed++;
          const errorMsg = result.reason instanceof Error ? result.reason.message : "Unknown error";
          console.error("[EMAIL_SEND_ERROR]", result.reason);
          recipientResults.push({ memberId: recipient.memberId, status: "failed", error: errorMsg });
        }
      }
    }

    if (quotaExhausted) {
      const remainingRecipients = validRecipients.slice(i + BATCH_SIZE);
      for (const r of remainingRecipients) {
        recipientResults.push({ memberId: r.memberId, status: "queued" });
      }
      break;
    }
  }

  return { sent, failed, suppressed: suppressed.length, results: recipientResults };
}
