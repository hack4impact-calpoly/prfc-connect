import "server-only";
import prisma from "@/lib/db";
import { env } from "@/env";
import { AppError, transformError } from "@/utils/errors";
import { getGroupRecipients } from "@/services/contact-group";
import { sendGroupEmails, validateEmailAllowed } from "@/services/email";
import { sendGroupSms, validateSmsAllowed } from "@/services/sms";
import { getConsentedPhones } from "@/services/sms-consent";
import { getMemberDetails, getAllActiveMemberIds } from "@/lib/api/member-api";
import type { ComposeMessage, BlastMessage } from "@/schema/contact-group";
import type { MockMember } from "@/lib/mock-members";
import type {
  MessageResult,
  MessageSummary,
  MessageHistoryItem,
  MessageDetail,
  RecipientStatus,
  RecipientCounts,
  MessageHistoryPage,
  MessageHistoryQuery,
} from "@/types/message";
export type {
  MessageResult,
  MessageSummary,
  MessageHistoryItem,
  MessageDetail,
  RecipientStatus,
  RecipientCounts,
  MessageHistoryPage,
  MessageHistoryQuery,
} from "@/types/message";

const DEFAULT_MESSAGE_HISTORY_LIMIT = 20;
const MAX_MESSAGE_HISTORY_LIMIT = 100;
const DEFAULT_PAGE_SIZE = 25;

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

export { isQuietHours, validateSmsAllowed } from "@/services/sms";

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

    const now = new Date();
    await Promise.all(
      emailResult.results.map((r) =>
        prisma.messageRecipient.updateMany({
          where: { messageId, channel: "email", memberId: r.memberId },
          data: {
            status: r.status,
            sentAt: now,
            externalId: r.externalId ?? null,
            error: r.error ?? null,
          },
        }),
      ),
    );

    return { sent: emailResult.sent, failed: emailResult.failed };
  } catch (error) {
    console.error("[sendEmailsForMessage] Failed:", error);
    return { sent: 0, failed: recipients.length };
  }
}

async function sendSmsForMessage(
  messageId: number,
  smsRecipientIds: number[],
  smsBody: string,
): Promise<{ sent: number; failed: number }> {
  try {
    const phoneMap = await getConsentedPhones(smsRecipientIds);
    const recipients = smsRecipientIds
      .filter((id) => phoneMap.has(id))
      .map((id) => ({ memberId: id, phone: phoneMap.get(id)! }));

    if (recipients.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const smsResult = await sendGroupSms({ recipients, body: smsBody });

    const now = new Date();
    await Promise.all(
      smsResult.results.map((r) =>
        prisma.messageRecipient.updateMany({
          where: { messageId, channel: "sms", memberId: r.memberId },
          data: {
            status: r.status,
            sentAt: now,
            externalId: r.externalId ?? null,
            error: r.error ?? null,
          },
        }),
      ),
    );

    return { sent: smsResult.sent, failed: smsResult.failed };
  } catch (error) {
    console.error("[sendSmsForMessage] Failed:", error);
    return { sent: 0, failed: smsRecipientIds.length };
  }
}

export async function sendGroupMessage(input: ComposeMessage, senderId: number): Promise<MessageResult> {
  try {
    const { groupIds, subject, body, smsBody, sendEmail, sendSms } = input;

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

      if (sendSms && smsRecipientIds.length > 0) {
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
    let smsSent = 0;
    let smsFailed = 0;

    if (sendEmail && emailRecipientIds.length > 0) {
      const emailRecipients = members.filter((m) => emailRecipientIds.includes(m.ownerid));
      const emailResult = await sendEmailsForMessage(result.id, emailRecipients, subject, body, groupIds);
      emailsSent = emailResult.sent;
      emailsFailed = emailResult.failed;
    }

    if (sendSms && smsRecipientIds.length > 0 && smsBody) {
      const smsResult = await sendSmsForMessage(result.id, smsRecipientIds, smsBody);
      smsSent = smsResult.sent;
      smsFailed = smsResult.failed;
    }

    await prisma.message.update({
      where: { id: result.id },
      data: {
        failedCount: emailsFailed + smsFailed,
      },
    });

    return {
      messageId: result.id,
      emailCount: emailsSent,
      smsCount: smsSent,
      failedCount: emailsFailed + smsFailed,
    };
  } catch (error) {
    throw transformError(error);
  }
}

export async function sendBlastMessage(input: BlastMessage, senderId: number): Promise<MessageResult> {
  try {
    const { subject, body, smsBody, sendEmail, sendSms } = input;

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

    let emailRecipientIds: number[] = [];
    if (sendEmail) {
      const optedOut = await prisma.userPreference.findMany({
        where: { memberId: { in: recipientIds }, notifyEmailDefault: false },
        select: { memberId: true },
      });
      const optedOutIds = new Set(optedOut.map((p) => p.memberId));
      emailRecipientIds = recipientIds.filter((id) => !optedOutIds.has(id));
    }
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

      if (sendSms && smsRecipientIds.length > 0) {
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
    let smsSent = 0;
    let smsFailed = 0;

    if (sendEmail && emailRecipientIds.length > 0) {
      const emailResult = await sendEmailsForMessage(result.id, members, subject, body, null);
      emailsSent = emailResult.sent;
      emailsFailed = emailResult.failed;
    }

    if (sendSms && smsRecipientIds.length > 0 && smsBody) {
      const smsResult = await sendSmsForMessage(result.id, smsRecipientIds, smsBody);
      smsSent = smsResult.sent;
      smsFailed = smsResult.failed;
    }

    await prisma.message.update({
      where: { id: result.id },
      data: {
        failedCount: emailsFailed + smsFailed,
      },
    });

    return {
      messageId: result.id,
      emailCount: emailsSent,
      smsCount: smsSent,
      failedCount: emailsFailed + smsFailed,
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

export async function getMessageHistoryPage(query: MessageHistoryQuery): Promise<MessageHistoryPage> {
  try {
    const {
      senderId,
      recipientId,
      search,
      channel,
      sort = "recent",
      cursor,
      direction = "forward",
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const where: Record<string, unknown> = {};
    if (senderId) where.senderId = senderId;
    const recipientFilter: Record<string, unknown> = {};
    if (recipientId) recipientFilter.memberId = recipientId;
    if (channel) recipientFilter.channel = channel;
    if (Object.keys(recipientFilter).length > 0) {
      where.recipients = { some: recipientFilter };
    }
    if (search) where.subject = { contains: search };

    const isBackward = direction === "backward";
    const orderDirection = sort === "oldest" ? ("asc" as const) : ("desc" as const);
    const take = isBackward ? -(pageSize + 1) : pageSize + 1;

    const select = {
      id: true,
      subject: true,
      body: true,
      sentAt: true,
      emailCount: true,
      smsCount: true,
      failedCount: true,
      isBlast: true,
      groups: { select: { group: { select: { name: true } } } },
    } as const;

    const [rawMessages, totalCount] = await Promise.all([
      cursor
        ? prisma.message.findMany({
            where,
            select,
            orderBy: { sentAt: orderDirection },
            take,
            cursor: { id: cursor },
            skip: 1,
          })
        : prisma.message.findMany({ where, select, orderBy: { sentAt: orderDirection }, take }),
      prisma.message.count({ where }),
    ]);

    let messages = [...rawMessages];
    let hasMore = false;

    if (isBackward) {
      if (messages.length > pageSize) {
        hasMore = true;
        messages = messages.slice(1);
      }
    } else {
      if (messages.length > pageSize) {
        hasMore = true;
        messages = messages.slice(0, pageSize);
      }
    }

    const items: MessageHistoryItem[] = messages.map((m) => ({
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

    let nextCursor: number | null = null;
    let prevCursor: number | null = null;

    if (items.length > 0) {
      if (isBackward) {
        nextCursor = items[items.length - 1].id;
        prevCursor = hasMore ? items[0].id : null;
      } else {
        nextCursor = hasMore ? items[items.length - 1].id : null;
        prevCursor = cursor ? items[0].id : null;
      }
    }

    return { items, totalCount, nextCursor, prevCursor };
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

export async function isMessageRecipient(messageId: number, memberId: number): Promise<boolean> {
  try {
    const record = await prisma.messageRecipient.findFirst({
      where: { messageId, memberId },
      select: { id: true },
    });
    return record !== null;
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
