"use client";

import "temporal-polyfill/global";
import { useEffect } from "react";
import { useNextCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import { createViewWeek } from "@schedule-x/calendar";
import "@schedule-x/theme-default/dist/index.css";
import { COOP_TZ, DEFAULT_EVENT_DURATION_MS, coopDateParts, coopWallClockToUtc } from "@/lib/time";
import type { EventType } from "@/generated/prisma/client";
import type { EventSummary } from "@/services/event";

type WeekCalendarEvent = Pick<EventSummary, "id" | "title" | "startDate" | "endDate" | "eventType" | "isAllDay">;

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

function toScheduleXEvents(events: WeekCalendarEvent[]) {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.isAllDay ? toFloatingPlainDate(e.startDate) : toCoopZonedDateTime(e.startDate),
    end: e.isAllDay ? toFloatingPlainDate(e.endDate) : toCoopZonedDateTime(e.endDate),
    calendarId: CALENDAR_ID_BY_TYPE[e.eventType],
  }));
}

function toFloatingPlainDate(d: Date): Temporal.PlainDate {
  return Temporal.PlainDate.from({
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  });
}

function toCoopPlainDate(d: Date): Temporal.PlainDate {
  const { year, month0, day } = coopDateParts(d);
  return Temporal.PlainDate.from({ year, month: month0 + 1, day });
}

function toCoopZonedDateTime(d: Date): Temporal.ZonedDateTime {
  const { year, month0, day, hour, minute } = coopDateParts(d);
  return Temporal.ZonedDateTime.from({
    year,
    month: month0 + 1,
    day,
    hour,
    minute,
    timeZone: COOP_TZ,
  });
}

export function WeekCalendar({ events, selectedDate, onEventClick, onTimeSlotClick }: Props) {
  const calendar = useNextCalendarApp({
    views: [createViewWeek()],
    firstDayOfWeek: 7,
    weekOptions: { gridHeight: 1152 },
    calendars: CALENDARS,
    timezone: COOP_TZ,
    selectedDate: selectedDate ? toCoopPlainDate(selectedDate) : undefined,
    events: toScheduleXEvents(events),
    callbacks: {
      onEventClick: (event) => {
        if (typeof event.id === "number") onEventClick?.(event.id);
      },
      onClickDateTime: (dateTime) => {
        const rounded = dateTime.round({
          smallestUnit: "minute",
          roundingIncrement: 15,
          roundingMode: "halfExpand",
        });
        const coopInstant = coopWallClockToUtc(
          rounded.year,
          rounded.month - 1,
          rounded.day,
          rounded.hour,
          rounded.minute,
        );
        const end = new Date(coopInstant.getTime() + DEFAULT_EVENT_DURATION_MS);
        onTimeSlotClick?.(coopInstant, end);
      },
    },
  });

  useEffect(() => {
    if (!calendar) return;
    calendar.events.set(toScheduleXEvents(events));
  }, [calendar, events]);

  return <ScheduleXCalendar calendarApp={calendar} />;
}
