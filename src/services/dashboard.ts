import "server-only";
import prisma from "@/lib/db";
import { transformError } from "@/utils/errors";

export interface ActivityItem {
  type: "message_sent" | "event_created";
  title: string;
  timestamp: Date;
}

export async function getRecentActivity(limit: number = 5): Promise<ActivityItem[]> {
  try {
    const [recentMessages, recentEvents] = await Promise.all([
      prisma.message.findMany({
        select: { subject: true, sentAt: true, emailCount: true },
        orderBy: { sentAt: "desc" },
        take: limit,
      }),
      prisma.event.findMany({
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
