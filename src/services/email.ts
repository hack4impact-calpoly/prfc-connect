import "server-only";
import fs from "fs";
import path from "path";
import { Resend } from "resend";
import type { Prospect } from "@/schema/referral";
import { AppError } from "@/utils/errors";
import type { RecipientSendResult } from "@/types/message";
import { env } from "@/env";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-tokens";
import { filterSuppressedEmails } from "./email-suppression";

let _client: Resend | null = null;
let _referralImage: string | null = null;

function getClient(): Resend {
  if (_client) return _client;
  _client = new Resend(env.RESEND_API_KEY);
  return _client;
}

function getReferralImage(): string {
  if (_referralImage) return _referralImage;
  const imgPath = path.join(process.cwd(), "public", "assets", "paso-coop.jpeg");
  _referralImage = fs.readFileSync(imgPath).toString("base64");
  return _referralImage;
}

export function validateEmailAllowed(): void {
  if (!env.EMAIL_ENABLED) {
    throw new AppError("FORBIDDEN", "Email functionality is currently disabled", { reason: "EMAIL_DISABLED" });
  }
  if (!env.RESEND_API_KEY) {
    throw new AppError("INTERNAL_ERROR", "Email provider API key is not configured");
  }
}

function applyRedirect(to: string, subject: string): { to: string; subject: string } {
  if (env.EMAIL_REDIRECT_TO) {
    return { to: env.EMAIL_REDIRECT_TO, subject: `[TEST to: ${to}] ${subject}` };
  }
  return { to, subject };
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
      const originalSubject = "You've Been Invited!";
      const { to, subject } = applyRedirect(prospect.prospectEmail, originalSubject);

      const { error } = await getClient().emails.send({
        from: env.FROM_EMAIL ?? "noreply@example.com",
        to,
        subject,
        html: generateEmailHtml(prospect.prospectName, memberName, referralCode),
        attachments: [{ filename: "paso-coop.jpeg", content: getReferralImage(), contentId: "pasoLogo" }],
      });

      if (error) throw new Error(error.message);
    }
  } catch (error) {
    throw new AppError("EMAIL_ERROR", "Failed to send referral emails", {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

function generateEmailHtml(prospectName: string, memberName: string, referralCode: string): string {
  return `<div style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="text-align: center;">
      <img src="cid:pasoLogo" alt="THE PASO FOOD CO-OP" style="max-width: 100%;">
    </div>
    <div style="padding: 20px;">
      <p>Hello ${prospectName},</p>
      <p>We're excited to let you know that <strong>${memberName}</strong>, thinks you'd love being a part of the Paso Robles Food Co-op!</p>
      <p>At the Co-op, we're all about building a stronger community by connecting members to fresh, healthy, and locally-sourced food. As a member owner, you'll enjoy:</p>
      <ul style="padding-left: 10px;">
        <li style="margin-bottom: 8px;">Supporting local farmers and food producers 🌱</li>
        <li style="margin-bottom: 8px;">A say in how the Co-op operates (yes, you're an owner!) 🗳️</li>
        <li style="margin-bottom: 8px;">Exclusive discounts and special events 🎉</li>
      </ul>
      <p>It's easy to join the Co-op and start making an impact in our community! Just click the link below to complete your membership registration:</p>
      <p>
        <span style="font-weight: bold;">👉 <a href="https://www.pasofoodcooperative.com/join-now1.html?enterReferral=${referralCode}" style="color: black; text-decoration: none;">Join Now</a></span>
      </p>
      <p>Your referral code is <strong>${referralCode}</strong>—be sure to confirm/enter it during registration.</p>
      <p>Feel free to reach out if you have any questions or want to learn more about what makes the Paso Robles Food Co-op special. Our monthly meeting is every 4<sup>th</sup> Wednesday at 6pm. All details and info at our website: <a href="www.pasofoodcooperative.com" style="color: #333; text-decoration: underline;">www.pasofoodcooperative.com</a></p>
      <p>Looking forward to welcoming you into our growing Co-op family!</p>
      <p>Warm regards,<br>${memberName} and The Paso Robles Food Co-op Member Owners</p>
      <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
        <p style="margin: 5px 0;">📧 <a href="mailto:info@pasofoodcooperative.com" style="color: #333; text-decoration: none;">info@pasofoodcooperative.com</a></p>
        <p style="margin: 5px 0;">🌐 <a href="www.pasofoodcooperative.com" style="color: #333; text-decoration: none;">www.pasofoodcooperative.com</a></p>
      </div>
    </div>
  </div>`;
}

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

export interface Recipient {
  email: string;
  memberId: number;
  name: string;
}

interface GroupEmailParams {
  recipients: Array<Recipient>;
  subject: string;
  body: string;
  senderName: string;
  replyTo: string;
  groupId: number;
}

export async function sendGroupEmails(
  params: GroupEmailParams,
): Promise<{ sent: number; failed: number; suppressed: number; results: RecipientSendResult[] }> {
  const { recipients, subject, body, senderName, replyTo, groupId } = params;

  const emails = recipients.map((r) => r.email);
  const { valid, suppressed } = await filterSuppressedEmails(emails);
  const validRecipients = recipients.filter((r) => valid.includes(r.email));

  let sent = 0;
  let failed = 0;
  const recipientResults: RecipientSendResult[] = [];

  for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
    const batch = validRecipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        const token = generateUnsubscribeToken(recipient.memberId, groupId);
        const unsubscribeUrl = `${env.APP_URL}/api/unsubscribe?token=${token}`;
        const htmlWithFooter =
          body +
          `
<hr>
<p style="font-size: 12px; color: #666;">
  <strong>Paso Robles Food Cooperative, Inc.</strong><br>
  P.O. Box 922, Paso Robles, CA 93447<br>
  <a href="${unsubscribeUrl}" style="color: #831002;">Unsubscribe from this group</a>
</p>
`;

        const { to, subject: redirectedSubject } = applyRedirect(recipient.email, subject);

        const { data, error } = await getClient().emails.send({
          from: `${senderName} <${env.FROM_EMAIL ?? ""}>`,
          to,
          replyTo,
          subject: redirectedSubject,
          html: htmlWithFooter,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        if (error) throw new Error(error.message);
        return { memberId: recipient.memberId, externalId: data?.id };
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
