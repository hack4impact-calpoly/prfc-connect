import "server-only";
import prisma from "@/lib/db";
import { env } from "@/env";
import { AppError, transformError } from "@/utils/errors";
import { getGroupRecipients } from "@/services/contact-group";
import { sendGroupEmails } from "@/services/email";
import { getMemberDetails, getAllActiveMemberIds } from "@/lib/api/member-api";
import type { ComposeMessage, BlastMessage } from "@/schema/contact-group";
import type { MockMember } from "@/lib/mock-members";

export interface MessageResult {
  messageId: number;
  emailCount: number;
  smsCount: number;
  failedCount: number;
}

export function isQuietHours(): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    hour12: false,
  });
  const hour = parseInt(formatter.format(new Date()));

  // TCPA compliance: no SMS before 8 AM or after 8 PM Pacific
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
}

async function sendEmailsForMessage(
  messageId: number,
  recipients: MockMember[],
  subject: string,
  body: string,
  groupId: number | null,
): Promise<{ sent: number; failed: number }> {
  try {
    const emailResult = await sendGroupEmails({
      recipients: recipients.map((r) => ({
        email: r.owneremail,
        memberId: r.ownerid,
        name: r.ownername,
      })),
      subject,
      body,
      senderName: "Paso Robles Food Co-op",
      replyTo: env.FROM_EMAIL,
      groupId: groupId ?? 0,
    });

    if (emailResult.failed === 0) {
      await prisma.messageRecipient.updateMany({
        where: {
          messageId,
          channel: "email",
          memberId: { in: recipients.map((r) => r.ownerid) },
        },
        data: {
          status: "sent",
          sentAt: new Date(),
        },
      });
    } else {
      await prisma.messageRecipient.updateMany({
        where: {
          messageId,
          channel: "email",
          memberId: { in: recipients.map((r) => r.ownerid) },
        },
        data: {
          status: "failed",
          sentAt: new Date(),
        },
      });
    }

    return { sent: emailResult.sent, failed: emailResult.failed };
  } catch (error) {
    console.error("[sendEmailsForMessage] Failed:", error);
    return { sent: 0, failed: recipients.length };
  }
}

export async function sendGroupMessage(input: ComposeMessage, senderId: number): Promise<MessageResult> {
  try {
    const { groupId, subject, body, sendEmail, sendSms } = input;

    if (!sendEmail && !sendSms) {
      throw new AppError("VALIDATION_ERROR", "At least one delivery method (email or SMS) must be selected");
    }

    if (sendSms) {
      validateSmsAllowed();
    }

    const emailRecipientIds = sendEmail ? await getGroupRecipients(groupId, "email") : [];
    const smsRecipientIds = sendSms ? await getGroupRecipients(groupId, "sms") : [];

    const allRecipientIds = Array.from(new Set([...emailRecipientIds, ...smsRecipientIds]));

    if (allRecipientIds.length === 0) {
      throw new AppError("VALIDATION_ERROR", "No recipients found for selected delivery methods");
    }

    const members = await getMemberDetails(allRecipientIds);

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          groupId,
          senderId,
          subject,
          body,
          emailCount: emailRecipientIds.length,
          smsCount: smsRecipientIds.length,
          failedCount: 0,
          isBlast: false,
        },
      });

      if (sendEmail && emailRecipientIds.length > 0) {
        await tx.messageRecipient.createMany({
          data: emailRecipientIds.map((memberId) => ({
            messageId: message.id,
            memberId,
            channel: "email",
            status: "pending",
          })),
        });
      }

      if (sendSms && smsRecipientIds.length > 0 && env.SMS_ENABLED) {
        await tx.messageRecipient.createMany({
          data: smsRecipientIds.map((memberId) => ({
            messageId: message.id,
            memberId,
            channel: "sms",
            status: "pending",
          })),
        });
      }

      return message;
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    if (sendEmail && emailRecipientIds.length > 0) {
      const emailRecipients = members.filter((m) => emailRecipientIds.includes(m.ownerid));
      const emailResult = await sendEmailsForMessage(result.id, emailRecipients, subject, body, groupId);
      emailsSent = emailResult.sent;
      emailsFailed = emailResult.failed;
    }

    const smsSent = 0;

    await prisma.message.update({
      where: { id: result.id },
      data: {
        failedCount: emailsFailed,
      },
    });

    return {
      messageId: result.id,
      emailCount: emailsSent,
      smsCount: smsSent,
      failedCount: emailsFailed,
    };
  } catch (error) {
    throw transformError(error);
  }
}

export async function sendBlastMessage(input: BlastMessage, senderId: number): Promise<MessageResult> {
  try {
    const { subject, body, sendEmail, sendSms } = input;

    if (!sendEmail && !sendSms) {
      throw new AppError("VALIDATION_ERROR", "At least one delivery method (email or SMS) must be selected");
    }

    if (sendSms) {
      validateSmsAllowed();
    }

    const recipientIds = await getAllActiveMemberIds();

    if (recipientIds.length === 0) {
      throw new AppError("VALIDATION_ERROR", "No members found to send blast message");
    }

    const members = await getMemberDetails(recipientIds);

    const emailRecipientIds = sendEmail ? recipientIds : [];
    const smsRecipientIds = sendSms ? recipientIds : [];

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          groupId: null,
          senderId,
          subject,
          body,
          emailCount: emailRecipientIds.length,
          smsCount: smsRecipientIds.length,
          failedCount: 0,
          isBlast: true,
        },
      });

      if (sendEmail && emailRecipientIds.length > 0) {
        await tx.messageRecipient.createMany({
          data: emailRecipientIds.map((memberId) => ({
            messageId: message.id,
            memberId,
            channel: "email",
            status: "pending",
          })),
        });
      }

      if (sendSms && smsRecipientIds.length > 0 && env.SMS_ENABLED) {
        await tx.messageRecipient.createMany({
          data: smsRecipientIds.map((memberId) => ({
            messageId: message.id,
            memberId,
            channel: "sms",
            status: "pending",
          })),
        });
      }

      return message;
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    if (sendEmail && emailRecipientIds.length > 0) {
      const emailResult = await sendEmailsForMessage(result.id, members, subject, body, null);
      emailsSent = emailResult.sent;
      emailsFailed = emailResult.failed;
    }

    const smsSent = 0;

    await prisma.message.update({
      where: { id: result.id },
      data: {
        failedCount: emailsFailed,
      },
    });

    return {
      messageId: result.id,
      emailCount: emailsSent,
      smsCount: smsSent,
      failedCount: emailsFailed,
    };
  } catch (error) {
    throw transformError(error);
  }
}
