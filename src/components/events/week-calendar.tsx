"use client";

import "temporal-polyfill/global";
import { useNextCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import { createViewWeek } from "@schedule-x/calendar";
import "@schedule-x/theme-default/dist/index.css";
import type { EventType } from "@/generated/prisma/client";
import type { EventSummary } from "@/services/event";

type WeekCalendarEvent = Pick<EventSummary, "id" | "title" | "startDate" | "endDate" | "eventType">;

type Props = {
  events: WeekCalendarEvent[];
  selectedDate?: Date;
  onEventClick?: (eventId: number) => void;
  onTimeSlotClick?: (start: Date, end: Date) => void;
};

const CALENDAR_ID_BY_TYPE: Record<EventType, string> = {
  social: "social",
  networking: "networking",
  meeting: "meeting",
  volunteer: "volunteer",
};

const CALENDARS = {
  social: {
    colorName: "social",
    lightColors: { main: "#523019", container: "#E3CDBC", onContainer: "#231F1F" },
  },
  networking: {
    colorName: "networking",
    lightColors: { main: "#C37A2E", container: "#F5E4CE", onContainer: "#231F1F" },
  },
  meeting: {
    colorName: "meeting",
    lightColors: { main: "#831002", container: "#F5D6D1", onContainer: "#231F1F" },
  },
  volunteer: {
    colorName: "volunteer",
    lightColors: { main: "#4A7C59", container: "#D4E6D8", onContainer: "#231F1F" },
  },
};

export function WeekCalendar({ events, selectedDate, onEventClick, onTimeSlotClick }: Props) {
  const calendar = useNextCalendarApp({
    views: [createViewWeek()],
    firstDayOfWeek: 7,
    weekOptions: { gridHeight: 1152 },
    calendars: CALENDARS,
    selectedDate: selectedDate
      ? Temporal.PlainDate.from({
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        })
      : undefined,
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      start: toZonedDateTime(e.startDate),
      end: toZonedDateTime(e.endDate),
      calendarId: CALENDAR_ID_BY_TYPE[e.eventType],
    })),
    callbacks: {
      onEventClick: (event) => {
        if (typeof event.id === "number") onEventClick?.(event.id);
      },
      onClickDateTime: (dateTime) => {
        const start = new Date(dateTime.epochMilliseconds);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        onTimeSlotClick?.(start, end);
      },
    },
  });

  return <ScheduleXCalendar calendarApp={calendar} />;
}

function toZonedDateTime(d: Date): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.from({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    timeZone: Temporal.Now.timeZoneId(),
  });
}
