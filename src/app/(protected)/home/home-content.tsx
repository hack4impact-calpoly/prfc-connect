"use client";

import { useRouter } from "next/navigation";
import { TotalMembersCard } from "@/components/dashboard/total-members-card";
import { EventsThisMonthCard } from "@/components/dashboard/events-this-month-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { UpcomingEventsCard } from "@/components/dashboard/upcoming-events-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { RecentMessagesCard } from "@/components/dashboard/recent-messages-card";
import type { EventSummary } from "@/types/event";
import type { ActivityItem } from "@/types/dashboard";
import type { MessageHistoryItem } from "@/types/message";

interface HomeContentProps {
  totalMembers: number;
  eventsThisMonth: number;
  upcomingEvents: EventSummary[];
  recentActivity: ActivityItem[];
  recentMessages: MessageHistoryItem[];
}

export function HomeContent({
  totalMembers,
  eventsThisMonth,
  upcomingEvents,
  recentActivity,
  recentMessages,
}: HomeContentProps) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-angkor text-3xl text-prfc-brown">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TotalMembersCard count={totalMembers} />
        <EventsThisMonthCard count={eventsThisMonth} />
        <QuickActionsCard
          onCreateEvent={() => router.push("/events")}
          onCreateGroup={() => router.push("/groups")}
          onSendMessage={() => router.push("/messages/compose")}
        />
      </div>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <UpcomingEventsCard events={upcomingEvents} />
        <div className="flex flex-col gap-4">
          <RecentActivityCard activities={recentActivity} />
          <RecentMessagesCard messages={recentMessages} />
        </div>
      </div>
    </div>
  );
}
