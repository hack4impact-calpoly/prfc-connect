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

function applyRedirect(to: string, subject: string): { to: string; subject: string } {
  if (env.EMAIL_REDIRECT_TO) {
    return { to: env.EMAIL_REDIRECT_TO, subject: `[TEST to: ${to}] ${subject}` };
  }
  return { to, subject };
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

export async function getRemainingEmailQuota(): Promise<number> {
  const sentToday = await getDailyEmailCount();
  return Math.max(0, env.DAILY_EMAIL_LIMIT - sentToday);
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
}: SendReferralEmailParams): Promise<void> {
  try {
    for (const prospect of prospects) {
      const suppressed = await isEmailSuppressed(prospect.prospectEmail);
      if (suppressed) continue;

      const originalSubject = "You've Been Invited!";
      const { to, subject } = applyRedirect(prospect.prospectEmail, originalSubject);
      const unsubscribeToken = generateEmailUnsubscribeToken(prospect.prospectEmail);
      const unsubscribeUrl = `${env.APP_URL}/api/unsubscribe?token=${unsubscribeToken}`;

      const joinUrl = `https://www.pasofoodcooperative.com/join-now1.html?enterReferral=${referralCode}`;
      const textContent = `Hi ${prospect.prospectName},\n\n${memberName} thinks you'd be a great fit for the Paso Robles Food Co-op. We are a member-owned grocery cooperative in Paso Robles, and each new member gets a vote in how we run the store.\n\nMembers shop at the Co-op, attend monthly meetings on the 4th Wednesday at 6 pm, and help choose which local farms and producers we carry. Annual membership is $25.\n\nUse referral code ${referralCode} when you register: ${joinUrl}\n\nQuestions? Reach us at info@pasofoodcooperative.com or visit pasofoodcooperative.com.\n\n---\nThis email was sent on behalf of a Co-op member who thought you might be interested.\nPaso Robles Food Cooperative, Inc. P.O. Box 922, Paso Robles, CA 93447\nUnsubscribe: ${unsubscribeUrl}`;

      await sendBrevoEmail({
        sender: { name: "Paso Robles Food Co-op", email: env.FROM_EMAIL ?? "noreply@example.com" },
        to: [{ email: to }],
        subject,
        htmlContent: generateReferralEmailHtml(prospect.prospectName, memberName, referralCode, unsubscribeUrl),
        textContent,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
    }
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
          <td style="padding: 0 24px 8px; ${cellStyle}">
            Hi ${safeName},
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 16px; ${cellStyle}">
            ${safeMember} thinks you'd be a great fit for the Paso Robles Food Co-op. We are a member-owned grocery cooperative in Paso Robles, and each new member gets a vote in how we run the store.
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 16px; ${cellStyle}">
            Members shop at the Co-op, attend monthly meetings on the 4th Wednesday at 6 pm, and help choose which local farms and producers we carry. Annual membership is $25.
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 24px; ${cellStyle}">
            Use referral code <strong>${safeCode}</strong> when you register:
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0 24px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="#831002" style="background-color: #831002; border-radius: 6px;">
                  <a href="${joinUrl}" style="${font} font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 32px;">Join the Co-op</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 24px; ${cellStyle}">
            Questions? Reach us at <a href="mailto:info@pasofoodcooperative.com" style="color: #831002;">info@pasofoodcooperative.com</a> or visit <a href="https://www.pasofoodcooperative.com" style="color: #831002;">pasofoodcooperative.com</a>.
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px; border-top: 1px solid #dddddd;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding: 8px 24px 16px; ${font} font-size: 12px; line-height: 1.5; color: #888888;">
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

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

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
        const unsubscribeUrl = `${env.APP_URL}/api/unsubscribe?token=${token}`;

        const footerHtml = `<strong>Paso Robles Food Cooperative, Inc.</strong><br>
            P.O. Box 922, Paso Robles, CA 93447<br>
            <a href="${unsubscribeUrl}" style="color: #831002;">Unsubscribe</a>`;

        const htmlContent = wrapInEmailTemplate(bodyHtml, footerHtml);

        const textContent = `${plainBody}\n\n---\nPaso Robles Food Cooperative, Inc.\nP.O. Box 922, Paso Robles, CA 93447\nUnsubscribe: ${unsubscribeUrl}`;

        const { to, subject: redirectedSubject } = applyRedirect(recipient.email, subject);

        const messageId = await sendBrevoEmail({
          sender: { name: senderName, email: env.FROM_EMAIL ?? "" },
          to: [{ email: to }],
          replyTo: { email: replyTo },
          subject: redirectedSubject,
          htmlContent,
          textContent,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        return { memberId: recipient.memberId, externalId: messageId };
      }),
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const recipient = batch[j];
      if (result.status === "fulfilled") {
        sent++;
        recipientResults.push({ memberId: recipient.memberId, status: "sent", externalId: result.value.externalId });
      } else {
        failed++;
        const errorMsg = result.reason instanceof Error ? result.reason.message : "Unknown error";
        console.error("[EMAIL_SEND_ERROR]", result.reason);
        recipientResults.push({ memberId: recipient.memberId, status: "failed", error: errorMsg });
      }
    }

    if (i + BATCH_SIZE < validRecipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return { sent, failed, suppressed: suppressed.length, results: recipientResults };
}
