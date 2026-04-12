"use client";

import { useState } from "react";
import { MonthCalendar } from "@/components/events/month-calendar";

const PREVIEW_EVENT_DATES = new Set(["2026-04-13", "2026-04-15", "2026-04-16", "2026-04-17"]);

export function RutledgeContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-04-01"));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Month Calendar Preview</h2>
          <div className="mt-4">
            <MonthCalendar
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              eventDates={PREVIEW_EVENT_DATES}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
