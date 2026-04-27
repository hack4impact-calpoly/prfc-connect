"use client";

import { MessageHistoryTable } from "@/components/messages/message-history-table";

const MOCK_MESSAGES = [
  {
    id: 1,
    subject: "Meeting tonight at 6 PM - please confirm attendance",
    sentAt: new Date("2026-01-06T19:57:01Z"),
    groupName: "PRFC Members",
    isBlast: false,
  },
  {
    id: 2,
    subject: "Volunteer signup for Saturday market",
    sentAt: new Date("2025-12-31T18:43:11Z"),
    groupName: "Volunteers",
    isBlast: false,
  },
  {
    id: 3,
    subject: "November newsletter update",
    sentAt: new Date("2025-11-06T19:57:20Z"),
    groupName: null,
    isBlast: true,
  },
  {
    id: 4,
    subject: "Board meeting rescheduled",
    sentAt: new Date("2025-10-06T19:57:59Z"),
    groupName: "Board",
    isBlast: false,
  },
  {
    id: 5,
    subject: "Fall harvest event details",
    sentAt: new Date("2025-09-06T19:57:09Z"),
    groupName: "Garden Committee",
    isBlast: false,
  },
];

export function RutledgeContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Message History Table Preview</h2>
          <div className="mt-4">
            <MessageHistoryTable messages={MOCK_MESSAGES} onView={(id) => console.log("View:", id)} />
          </div>
        </div>
      </div>
    </div>
  );
}
