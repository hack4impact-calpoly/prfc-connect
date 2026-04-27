import { addDays, endOfWeek, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const COOP_TZ = "America/Los_Angeles";

export const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;
export const DEFAULT_EVENT_START_HOUR = 9;

export type TimeSlot = { value: string; label: string };
export type TimeOfDay = { hour: number; minute: number };
export type CoopDateParts = { year: number; month0: number; day: number; hour: number; minute: number };

export const TIME_SLOTS: readonly TimeSlot[] = (() => {
  const slots: TimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      slots.push({ value: `${hh}:${mm}`, label: `${hour12}:${mm} ${period}` });
    }
  }
  return slots;
})();

export function formatCoopTimeValue(d: Date | null): string | null {
  if (!d) return null;
  return formatInTimeZone(d, COOP_TZ, "HH:mm");
}

export function coopWallClockToUtc(year: number, month0: number, day: number, hour = 0, minute = 0, second = 0): Date {
  const isoLocal = `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  return fromZonedTime(isoLocal, COOP_TZ);
}

export function coopDateParts(d: Date): CoopDateParts {
  return {
    year: parseInt(formatInTimeZone(d, COOP_TZ, "yyyy"), 10),
    month0: parseInt(formatInTimeZone(d, COOP_TZ, "M"), 10) - 1,
    day: parseInt(formatInTimeZone(d, COOP_TZ, "d"), 10),
    hour: parseInt(formatInTimeZone(d, COOP_TZ, "H"), 10),
    minute: parseInt(formatInTimeZone(d, COOP_TZ, "m"), 10),
  };
}

export function coopNow(): CoopDateParts {
  return coopDateParts(new Date());
}

export function coopFloatingDate(year: number, month0: number, day: number): Date {
  return new Date(Date.UTC(year, month0, day, 0, 0, 0, 0));
}

export function floatingDateToLocal(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function coopStartOfWeek(anchor: Date): Date {
  const zoned = toZonedTime(anchor, COOP_TZ);
  const start = startOfWeek(zoned, { weekStartsOn: 0 });
  return fromZonedTime(start, COOP_TZ);
}

export function coopEndOfWeek(anchor: Date): Date {
  const zoned = toZonedTime(anchor, COOP_TZ);
  const end = endOfWeek(zoned, { weekStartsOn: 0 });
  return fromZonedTime(end, COOP_TZ);
}

export function coopStartOfMonth(year: number, month1Based: number): Date {
  return coopWallClockToUtc(year, month1Based - 1, 1, 0, 0, 0);
}

function lastDayOfMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function coopEndOfMonth(year: number, month1Based: number): Date {
  return coopWallClockToUtc(year, month1Based - 1, lastDayOfMonth(year, month1Based), 23, 59, 59);
}

export function utcStartOfMonth(year: number, month1Based: number): Date {
  return new Date(Date.UTC(year, month1Based - 1, 1, 0, 0, 0, 0));
}

export function utcEndOfMonth(year: number, month1Based: number): Date {
  return new Date(Date.UTC(year, month1Based - 1, lastDayOfMonth(year, month1Based), 23, 59, 59, 999));
}

export function utcStartOfWeek(anchor: Date): Date {
  const utcMidnight = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()));
  const sundayOffset = utcMidnight.getUTCDay();
  return new Date(
    Date.UTC(utcMidnight.getUTCFullYear(), utcMidnight.getUTCMonth(), utcMidnight.getUTCDate() - sundayOffset),
  );
}

export function utcEndOfWeek(anchor: Date): Date {
  const start = utcStartOfWeek(anchor);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
}

export function coopDayKey(d: Date): string {
  return formatInTimeZone(d, COOP_TZ, "yyyy-MM-dd");
}

export function floatingDayKey(d: Date): string {
  return formatInTimeZone(d, "UTC", "yyyy-MM-dd");
}

export function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function coopFormatTimed(d: Date, pattern: string): string {
  return formatInTimeZone(d, COOP_TZ, pattern);
}

export function coopFormatFloating(d: Date, pattern: string): string {
  return formatInTimeZone(d, "UTC", pattern);
}

export function coopHourOfDay(d: Date): number {
  return parseInt(formatInTimeZone(d, COOP_TZ, "H"), 10);
}

export function eventDayKeys(event: { startDate: Date; endDate: Date; isAllDay: boolean }): string[] {
  const zone = event.isAllDay ? "UTC" : COOP_TZ;
  const startKey = formatInTimeZone(event.startDate, zone, "yyyy-MM-dd");
  const endKey = formatInTimeZone(event.endDate, zone, "yyyy-MM-dd");
  const [sy, sm, sd] = startKey.split("-").map(Number);
  const [ey, em, ed] = endKey.split("-").map(Number);
  const keys: string[] = [];
  const cur = new Date(Date.UTC(sy, sm - 1, sd));
  const last = new Date(Date.UTC(ey, em - 1, ed));
  while (cur.getTime() <= last.getTime()) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
    const day = String(cur.getUTCDate()).padStart(2, "0");
    keys.push(`${y}-${m}-${day}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return keys;
}

export function coopSameDay(a: Date, b: Date, isAllDay: boolean): boolean {
  if (isAllDay) return floatingDayKey(a) === floatingDayKey(b);
  return coopDayKey(a) === coopDayKey(b);
}

export function coopAddDays(d: Date, days: number): Date {
  const zoned = toZonedTime(d, COOP_TZ);
  const next = addDays(zoned, days);
  return fromZonedTime(next, COOP_TZ);
}

export function parseTimeInput(input: string): TimeOfDay | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  let ampm: "am" | "pm" | null = null;
  let core = trimmed.replace(/\s+/g, "");

  if (core.endsWith("pm") || core.endsWith("p")) {
    ampm = "pm";
    core = core.replace(/p(m)?$/, "");
  } else if (core.endsWith("am") || core.endsWith("a")) {
    ampm = "am";
    core = core.replace(/a(m)?$/, "");
  }

  if (!core) return null;

  let hour: number;
  let minute = 0;

  if (core.includes(":")) {
    const [hStr, mStr] = core.split(":");
    if (hStr === "" || mStr === undefined || mStr === "") return null;
    hour = parseInt(hStr, 10);
    minute = parseInt(mStr, 10);
  } else if (/^\d+$/.test(core)) {
    if (core.length === 4) {
      hour = parseInt(core.slice(0, 2), 10);
      minute = parseInt(core.slice(2), 10);
    } else if (core.length === 3) {
      hour = parseInt(core.slice(0, 1), 10);
      minute = parseInt(core.slice(1), 10);
    } else if (core.length <= 2) {
      hour = parseInt(core, 10);
    } else {
      return null;
    }
  } else {
    return null;
  }

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (minute < 0 || minute > 59) return null;

  if (ampm === "pm") {
    if (hour < 1 || hour > 12) return null;
    if (hour !== 12) hour += 12;
  } else if (ampm === "am") {
    if (hour < 1 || hour > 12) return null;
    if (hour === 12) hour = 0;
  } else {
    if (hour < 0 || hour > 23) return null;
  }

  return { hour, minute };
}
