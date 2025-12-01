import nodemailer from "nodemailer";
import path from "path";
import type { Prospect } from "@/schema/referral";
import { AppError } from "@/utils/errors";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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
        from: process.env.FROM_EMAIL,
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
