import "server-only";
import prisma from "@/lib/db";
import { env } from "@/env";
import { AppError, transformError } from "@/utils/errors";
import { getGroupRecipients } from "@/services/contact-group";
import { sendGroupEmails, validateEmailAllowed } from "@/services/email";
import { getMemberDetails, getAllActiveMemberIds } from "@/lib/api/member-api";
import { coopHourOfDay } from "@/utils/time";
import type { ComposeMessage, BlastMessage } from "@/schema/contact-group";
import type { MockMember } from "@/lib/mock-members";
import type {
  MessageResult,
  MessageSummary,
  MessageHistoryItem,
  MessageDetail,
  RecipientStatus,
  RecipientCounts,
} from "@/types/message";
export type {
  MessageResult,
  MessageSummary,
  MessageHistoryItem,
  MessageDetail,
  RecipientStatus,
  RecipientCounts,
} from "@/types/message";

const DEFAULT_MESSAGE_HISTORY_LIMIT = 20;
const MAX_MESSAGE_HISTORY_LIMIT = 100;

export async function getGroupMessageHistory(
  groupId: number,
  limit: number = DEFAULT_MESSAGE_HISTORY_LIMIT,
): Promise<MessageSummary[]> {
  try {
    const effectiveLimit = Math.min(Math.max(1, limit), MAX_MESSAGE_HISTORY_LIMIT);

    const messages = await prisma.message.findMany({
      where: { groups: { some: { groupId } } },
      select: {
        id: true,
        subject: true,
        body: true,
        sentAt: true,
        senderId: true,
        emailCount: true,
        smsCount: true,
        failedCount: true,
      },
      orderBy: { sentAt: "desc" },
      take: effectiveLimit,
    });

    return messages;
  } catch (error) {
    throw transformError(error);
  }
}

export function isQuietHours(): boolean {
  // TCPA compliance: no SMS before 8 AM or after 8 PM Pacific
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
}

async function sendEmailsForMessage(
  messageId: number,
  recipients: MockMember[],
  subject: string,
  body: string,
  groupIds: number[] | null,
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
      replyTo: env.FROM_EMAIL ?? "",
      groupId: groupIds?.[0] ?? 0,
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
    const { groupIds, subject, body, sendEmail, sendSms } = input;

    if (!sendEmail && !sendSms) {
      throw new AppError("VALIDATION_ERROR", "At least one delivery method (email or SMS) must be selected");
    }

    if (sendEmail) {
      validateEmailAllowed();
    }

    if (sendSms) {
      validateSmsAllowed();
    }

    const emailSets = sendEmail ? await Promise.all(groupIds.map((gid) => getGroupRecipients(gid, "email"))) : [];
    const smsSets = sendSms ? await Promise.all(groupIds.map((gid) => getGroupRecipients(gid, "sms"))) : [];

    const emailRecipientIds = Array.from(new Set(emailSets.flat()));
    const smsRecipientIds = Array.from(new Set(smsSets.flat()));
    const allRecipientIds = Array.from(new Set([...emailRecipientIds, ...smsRecipientIds]));

    if (allRecipientIds.length === 0) {
      throw new AppError("VALIDATION_ERROR", "No recipients found for selected delivery methods");
    }

    const members = await getMemberDetails(allRecipientIds);

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          senderId,
          subject,
          body,
          emailCount: emailRecipientIds.length,
          smsCount: smsRecipientIds.length,
          failedCount: 0,
          isBlast: false,
        },
      });

      await tx.messageGroup.createMany({
        data: groupIds.map((groupId) => ({ messageId: message.id, groupId })),
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
      const emailResult = await sendEmailsForMessage(result.id, emailRecipients, subject, body, groupIds);
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

    if (sendEmail) {
      validateEmailAllowed();
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

export async function getAllMessageHistory(options: {
  senderId?: number;
  limit?: number;
  offset?: number;
  channel?: "email" | "sms";
}): Promise<MessageHistoryItem[]> {
  try {
    const { senderId, limit = 50, offset = 0, channel } = options;
    const effectiveLimit = Math.min(Math.max(1, limit), MAX_MESSAGE_HISTORY_LIMIT);

    const where: Record<string, unknown> = {};
    if (senderId) where.senderId = senderId;
    if (channel) {
      where.recipients = { some: { channel } };
    }

    const messages = await prisma.message.findMany({
      where,
      select: {
        id: true,
        subject: true,
        body: true,
        sentAt: true,
        emailCount: true,
        smsCount: true,
        failedCount: true,
        isBlast: true,
        groups: { select: { group: { select: { name: true } } } },
      },
      orderBy: { sentAt: "desc" },
      take: effectiveLimit,
      skip: offset,
    });

    return messages.map((m) => ({
      id: m.id,
      subject: m.subject,
      body: m.body,
      sentAt: m.sentAt,
      emailCount: m.emailCount,
      smsCount: m.smsCount,
      failedCount: m.failedCount,
      isBlast: m.isBlast,
      groupNames: m.groups.map((mg) => mg.group.name),
    }));
  } catch (error) {
    throw transformError(error);
  }
}

export async function getMessageById(messageId: number): Promise<MessageDetail> {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        subject: true,
        body: true,
        sentAt: true,
        senderId: true,
        emailCount: true,
        smsCount: true,
        failedCount: true,
        isBlast: true,
        groups: { select: { group: { select: { name: true } } } },
      },
    });

    if (!message) {
      throw new AppError("NOT_FOUND", "Message not found");
    }

    return {
      ...message,
      groupNames: message.groups.map((mg) => mg.group.name),
    };
  } catch (error) {
    throw transformError(error);
  }
}

export async function getMessageRecipients(messageId: number): Promise<RecipientStatus[]> {
  try {
    const recipients = await prisma.messageRecipient.findMany({
      where: { messageId },
      select: {
        memberId: true,
        channel: true,
        status: true,
        sentAt: true,
      },
      orderBy: { memberId: "asc" },
    });

    const memberIds = Array.from(new Set(recipients.map((r) => r.memberId)));
    const members = await getMemberDetails(memberIds);
    const memberMap = new Map(members.map((m) => [m.ownerid, m.ownername]));

    return recipients.map((r) => ({
      memberId: r.memberId,
      memberName: memberMap.get(r.memberId) ?? "Unknown Member",
      channel: r.channel,
      status: r.status,
      sentAt: r.sentAt,
    }));
  } catch (error) {
    throw transformError(error);
  }
}

export async function previewRecipientCounts(groupId: number): Promise<RecipientCounts> {
  try {
    const [emailEligible, smsEligible, totalMembers] = await Promise.all([
      prisma.contactGroupMember.count({
        where: { groupId, notifyEmail: true },
      }),
      prisma.contactGroupMember.count({
        where: { groupId, notifySms: true },
      }),
      prisma.contactGroupMember.count({
        where: { groupId },
      }),
    ]);

    return {
      emailEligible,
      smsEligible,
      smsIneligible: totalMembers - smsEligible,
    };
  } catch (error) {
    throw transformError(error);
  }
}
