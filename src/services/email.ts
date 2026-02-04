import "server-only";
import nodemailer from "nodemailer";
import path from "path";
import prisma from "@/lib/db";
import type { Prospect } from "@/schema/referral";
import type { EmailSuppressionReason } from "@/generated/prisma/client";
import { AppError, transformError } from "@/utils/errors";
import { env } from "@/env";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-tokens";

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10,
  rateDelta: 1000,
  socketTimeout: 45000,
  connectionTimeout: 30000,
});

process.on("SIGTERM", () => {
  console.log("Closing email transport...");
  transport.close();
});

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
  const emailImgPath = path.join(process.cwd(), "public", "assets", "paso-coop.jpeg");

  try {
    for (const prospect of prospects) {
      const mail = {
        from: env.FROM_EMAIL,
        to: prospect.prospectEmail,
        subject: "You've Been Invited!",
        html: generateEmailHtml(prospect.prospectName, memberName, referralCode),
        attachments: [
          {
            filename: "paso-coop.jpeg",
            path: emailImgPath,
            cid: "pasoLogo",
          },
        ],
      };

      await transport.sendMail(mail);
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

export async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    const suppression = await prisma.emailSuppression.findUnique({
      where: { email: email.toLowerCase() },
    });
    return suppression !== null;
  } catch (error) {
    throw transformError(error);
  }
}

export async function suppressEmail(email: string, reason: EmailSuppressionReason): Promise<void> {
  try {
    await prisma.emailSuppression.upsert({
      where: { email: email.toLowerCase() },
      update: { reason, suppressedAt: new Date() },
      create: { email: email.toLowerCase(), reason },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function filterSuppressedEmails(emails: string[]): Promise<{ valid: string[]; suppressed: string[] }> {
  try {
    const suppressions = await prisma.emailSuppression.findMany({
      where: { email: { in: emails.map((e) => e.toLowerCase()) } },
      select: { email: true },
    });

    const suppressedSet = new Set(suppressions.map((s) => s.email));

    return {
      valid: emails.filter((e) => !suppressedSet.has(e.toLowerCase())),
      suppressed: emails.filter((e) => suppressedSet.has(e.toLowerCase())),
    };
  } catch (error) {
    throw transformError(error);
  }
}

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

interface GroupEmailParams {
  recipients: Array<{ email: string; memberId: number; name: string }>;
  subject: string;
  body: string;
  senderName: string;
  replyTo: string;
  groupId: number;
}

export async function sendGroupEmails(
  params: GroupEmailParams,
): Promise<{ sent: number; failed: number; suppressed: number }> {
  const { recipients, subject, body, senderName, replyTo, groupId } = params;

  const emails = recipients.map((r) => r.email);
  const { valid, suppressed } = await filterSuppressedEmails(emails);
  const validRecipients = recipients.filter((r) => valid.includes(r.email));

  let sent = 0;
  let failed = 0;

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

        await transport.sendMail({
          from: `${senderName} <${env.FROM_EMAIL}>`,
          to: recipient.email,
          replyTo,
          subject,
          html: htmlWithFooter,
          headers: {
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "List-Unsubscribe": {
              prepared: true,
              value: `<${unsubscribeUrl}>`,
            },
          },
        });
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        console.error("[EMAIL_SEND_ERROR]", result.reason);
      }
    }

    if (i + BATCH_SIZE < validRecipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return { sent, failed, suppressed: suppressed.length };
}
