import type { EventSummary } from "@/types/event";
import type { MessageHistoryItem } from "@/types/message";

export interface ActivityItem {
  type: "message_sent" | "event_created";
  title: string;
  timestamp: Date;
}

export interface DashboardData {
  totalMembers: number;
  eventsThisMonth: number;
  upcomingEvents: EventSummary[];
  recentActivity: ActivityItem[];
  recentMessages: MessageHistoryItem[];
}
