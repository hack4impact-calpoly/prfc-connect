"use client";

import { WeekCalendar } from "@/components/week-calendar";
import type { EventType } from "@/generated/prisma/client";

const PREVIEW_EVENTS: Array<{
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  eventType: EventType;
}> = [
  {
    id: 1,
    title: "Co-op Social Night",
    startDate: new Date("2026-04-13T10:00:00"),
    endDate: new Date("2026-04-13T11:30:00"),
    eventType: "social",
  },
  {
    id: 2,
    title: "Board Meeting",
    startDate: new Date("2026-04-15T14:00:00"),
    endDate: new Date("2026-04-15T15:00:00"),
    eventType: "meeting",
  },
  {
    id: 3,
    title: "Volunteer Shift",
    startDate: new Date("2026-04-17T09:00:00"),
    endDate: new Date("2026-04-17T12:00:00"),
    eventType: "volunteer",
  },
  {
    id: 4,
    title: "Networking Mixer",
    startDate: new Date("2026-04-16T17:00:00"),
    endDate: new Date("2026-04-16T18:30:00"),
    eventType: "networking",
  },
];

export function RutledgeContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Fun Fact</h2>
          <p className="mt-2 text-muted-foreground">I recently got into K-dramas and I love them.</p>
        </div>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Week Calendar Preview</h2>
          <div className="mt-4 h-[700px]">
            <WeekCalendar events={PREVIEW_EVENTS} selectedDate={new Date("2026-04-13T00:00:00")} />
          </div>
        </div>
      </div>
    </div>
  );
}
