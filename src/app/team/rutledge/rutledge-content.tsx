"use client";

import { UpcomingEventsCard } from "@/components/dashboard/upcoming-events-card";

export function RutledgeContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10 space-y-6">
          <UpcomingEventsCard
            events={[
              {
                id: 1,
                title: "Local Bites @ Winery",
                startDate: new Date("2026-04-30T01:00:00Z"),
                eventType: "social",
                groupName: "Food Lovers",
                rsvpCount: 25,
              },
              {
                id: 2,
                title: "Co-Op Info Session",
                startDate: new Date("2026-05-05T19:00:00Z"),
                eventType: "networking",
                groupName: "New Members",
                rsvpCount: 18,
              },
              {
                id: 3,
                title: "Member Town Hall",
                startDate: new Date("2026-05-08T01:00:00Z"),
                eventType: "meeting",
                groupName: "PRFC Members",
                rsvpCount: 20,
              },
              {
                id: 4,
                title: "Chamber Networking",
                startDate: new Date("2026-05-12T00:30:00Z"),
                eventType: "volunteer",
                groupName: "PRFC Members",
                rsvpCount: 12,
              },
            ]}
          />
          <UpcomingEventsCard events={[]} />
        </div>
      </div>
    </div>
  );
}
