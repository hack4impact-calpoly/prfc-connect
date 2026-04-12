"use client";

import { useState } from "react";
import { MonthCalendar } from "@/components/events/month-calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CreateEventPopover } from "@/components/events/create-event-popover";
import type { GroupOption, MemberOption } from "@/components/events/invitee-combobox";

const PREVIEW_EVENT_DATES = new Set(["2026-04-13", "2026-04-15", "2026-04-16", "2026-04-17"]);

const MOCK_GROUPS: GroupOption[] = [
  { id: 1, name: "Board of Directors", memberCount: 7 },
  { id: 2, name: "General Members", memberCount: 142 },
  { id: 3, name: "Volunteers", memberCount: 23 },
  { id: 4, name: "Garden Committee", memberCount: 12 },
];

const MOCK_MEMBERS: MemberOption[] = [
  { ownerid: 100001, ownername: "Kevin Rutledge" },
  { ownerid: 100002, ownername: "Mary Jones" },
  { ownerid: 100003, ownername: "Tom Wilson" },
  { ownerid: 100004, ownername: "Sarah Chen" },
  { ownerid: 100005, ownername: "Derek Phan" },
  { ownerid: 100006, ownername: "Amy Lin" },
  { ownerid: 100007, ownername: "Jordan Ma" },
  { ownerid: 100008, ownername: "Priya Kakani" },
];

export function RutledgeContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date("2026-04-01"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date>();

  const handleDayClick = (date: Date) => {
    const withDefaultTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0);
    setDefaultDate(withDefaultTime);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Kevin Rutledge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tech Lead</p>
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Month Calendar Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Click any day to open the create event popover.</p>
          <div className="mt-4">
            <MonthCalendar
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              eventDates={PREVIEW_EVENT_DATES}
              onDayClick={handleDayClick}
            />
          </div>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[820px] gap-0 p-0">
          <CreateEventPopover
            onClose={() => setDialogOpen(false)}
            defaultDate={defaultDate}
            groups={MOCK_GROUPS}
            members={MOCK_MEMBERS}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
