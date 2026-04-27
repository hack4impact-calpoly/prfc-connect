"use client";

import { RecentMessagesCard } from "@/components/dashboard/recent-messages-card";

export function RutledgeContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Recent Messages Card Preview</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RecentMessagesCard
              messages={[
                {
                  id: 1,
                  subject: "Meeting tonight at 6 PM",
                  groupName: "PRFC Members",
                  isBlast: false,
                  sentAt: new Date("2026-04-25T10:00:00"),
                },
                {
                  id: 2,
                  subject: "Volunteer signup for Saturday",
                  groupName: "Volunteers",
                  isBlast: false,
                  sentAt: new Date("2026-04-24T14:00:00"),
                },
                {
                  id: 3,
                  subject: "April newsletter",
                  groupName: null,
                  isBlast: true,
                  sentAt: new Date("2026-04-23T09:00:00"),
                },
              ]}
            />
            <RecentMessagesCard messages={[]} />
          </div>
        </div>
      </div>
    </div>
  );
}
