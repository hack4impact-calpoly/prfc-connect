"use client";

import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";

export function RutledgeContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Recent Activity Card Preview</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RecentActivityCard
              activities={[
                {
                  type: "message_sent",
                  title: "Message sent to 120 Members",
                  timestamp: new Date("2026-04-25T10:00:00"),
                },
                { type: "event_created", title: "New Member Joined", timestamp: new Date("2026-04-24T14:00:00") },
                {
                  type: "event_created",
                  title: "Event Created: Local Bites",
                  timestamp: new Date("2026-04-23T09:00:00"),
                },
              ]}
            />
            <RecentActivityCard activities={[]} />
          </div>
        </div>
      </div>
    </div>
  );
}
