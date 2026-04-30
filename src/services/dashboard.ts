import "server-only";
import prisma from "@/lib/db";
import { transformError } from "@/utils/errors";
import type { ActivityItem } from "@/types/dashboard";
export type { ActivityItem } from "@/types/dashboard";

export async function getRecentActivity(memberId: number, limit: number = 5): Promise<ActivityItem[]> {
  try {
    const [recentMessages, recentEvents] = await Promise.all([
      prisma.message.findMany({
        where: { recipients: { some: { memberId } } },
        select: { subject: true, sentAt: true, emailCount: true },
        orderBy: { sentAt: "desc" },
        take: limit,
      }),
      prisma.event.findMany({
        where: {
          OR: [{ invitees: { some: { memberId } } }, { ownerid: memberId }],
        },
        select: { title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const items: ActivityItem[] = [
      ...recentMessages.map((m) => ({
        type: "message_sent" as const,
        title: `Message sent to ${m.emailCount} Members`,
        timestamp: m.sentAt,
      })),
      ...recentEvents.map((e) => ({
        type: "event_created" as const,
        title: `Event Created: ${e.title}`,
        timestamp: e.createdAt,
      })),
    ];

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  } catch (error) {
    throw transformError(error);
  }
}

const DEFAULT_LOOKBACK_DAYS = 30;

export async function getLastNotificationSeenAt(memberId: number): Promise<Date | null> {
  try {
    const pref = await prisma.userPreference.findUnique({
      where: { memberId },
      select: { lastNotificationSeenAt: true },
    });
    return pref?.lastNotificationSeenAt ?? null;
  } catch (error) {
    throw transformError(error);
  }
}

export async function getUnseenNotificationCount(memberId: number): Promise<number> {
  try {
    const lastSeenAt = await getLastNotificationSeenAt(memberId);
    const lastSeen = lastSeenAt ?? new Date(Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const [messageCount, eventCount] = await Promise.all([
      prisma.message.count({
        where: { sentAt: { gt: lastSeen }, recipients: { some: { memberId } } },
      }),
      prisma.event.count({
        where: {
          createdAt: { gt: lastSeen },
          OR: [{ invitees: { some: { memberId } } }, { ownerid: memberId }],
        },
      }),
    ]);

    return messageCount + eventCount;
  } catch (error) {
    throw transformError(error);
  }
}

export async function markNotificationsSeen(memberId: number): Promise<void> {
  try {
    await prisma.userPreference.upsert({
      where: { memberId },
      update: { lastNotificationSeenAt: new Date() },
      create: {
        memberId,
        lastNotificationSeenAt: new Date(),
      },
    });
  } catch (error) {
    throw transformError(error);
  }
}
