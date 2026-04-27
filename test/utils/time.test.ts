import {
  COOP_TZ,
  coopAddDays,
  coopDayKey,
  coopEndOfMonth,
  coopEndOfWeek,
  coopFloatingDate,
  coopFormatFloating,
  coopFormatTimed,
  coopHourOfDay,
  coopSameDay,
  coopStartOfMonth,
  coopStartOfWeek,
  coopWallClockToUtc,
  eventDayKeys,
  floatingDayKey,
  localDayKey,
  parseTimeInput,
  utcEndOfMonth,
  utcEndOfWeek,
  utcStartOfMonth,
  utcStartOfWeek,
} from "@/utils/time";

describe("COOP_TZ constant", () => {
  it("is America/Los_Angeles", () => {
    expect(COOP_TZ).toBe("America/Los_Angeles");
  });
});

describe("coopWallClockToUtc", () => {
  it("converts 2pm Pacific on a PDT date to 21:00 UTC", () => {
    const d = coopWallClockToUtc(2026, 3, 15, 14, 0, 0);
    expect(d.toISOString()).toBe("2026-04-15T21:00:00.000Z");
  });

  it("converts 2pm Pacific on a PST date to 22:00 UTC", () => {
    const d = coopWallClockToUtc(2026, 0, 15, 14, 0, 0);
    expect(d.toISOString()).toBe("2026-01-15T22:00:00.000Z");
  });

  it("produces the same instant regardless of host TZ", () => {
    const d = coopWallClockToUtc(2026, 3, 15, 14, 0, 0);
    expect(d.getTime()).toBe(Date.UTC(2026, 3, 15, 21, 0, 0));
  });

  it("handles midnight correctly", () => {
    const d = coopWallClockToUtc(2026, 3, 15, 0, 0, 0);
    expect(d.toISOString()).toBe("2026-04-15T07:00:00.000Z");
  });

  it("handles 23:59 correctly", () => {
    const d = coopWallClockToUtc(2026, 3, 15, 23, 59, 59);
    expect(d.toISOString()).toBe("2026-04-16T06:59:59.000Z");
  });

  it("spring-forward day: non-existent 2:30 AM Mar 8 2026 resolves deterministically (date-fns-tz uses post-jump offset)", () => {
    const d = coopWallClockToUtc(2026, 2, 8, 2, 30, 0);
    expect(d.toISOString()).toBe("2026-03-08T09:30:00.000Z");
  });

  it("fall-back day: 1:30am coop wall-clock on Nov 1 2026 is ambiguous, resolves consistently", () => {
    const d = coopWallClockToUtc(2026, 10, 1, 1, 30, 0);
    const iso = d.toISOString();
    expect(iso === "2026-11-01T08:30:00.000Z" || iso === "2026-11-01T09:30:00.000Z").toBe(true);
  });
});

describe("coopFloatingDate", () => {
  it("returns UTC midnight of the given date", () => {
    const d = coopFloatingDate(2026, 3, 15);
    expect(d.toISOString()).toBe("2026-04-15T00:00:00.000Z");
  });

  it("produces the same instant regardless of host TZ", () => {
    const d = coopFloatingDate(2026, 3, 15);
    expect(d.getTime()).toBe(Date.UTC(2026, 3, 15));
  });
});

describe("coopStartOfWeek", () => {
  it("returns Sunday 00:00 Pacific as UTC for a mid-week anchor", () => {
    const anchor = new Date("2026-04-15T21:00:00.000Z");
    const start = coopStartOfWeek(anchor);
    expect(start.toISOString()).toBe("2026-04-12T07:00:00.000Z");
  });

  it("Saturday 11:30 PM Pacific belongs to the week starting the previous Sunday", () => {
    const satNight = new Date("2026-04-12T06:30:00.000Z");
    const start = coopStartOfWeek(satNight);
    expect(start.toISOString()).toBe("2026-04-05T07:00:00.000Z");
  });

  it("Sunday 00:05 Pacific belongs to the week starting that same Sunday", () => {
    const sunEarly = new Date("2026-04-12T07:05:00.000Z");
    const start = coopStartOfWeek(sunEarly);
    expect(start.toISOString()).toBe("2026-04-12T07:00:00.000Z");
  });
});

describe("coopEndOfWeek", () => {
  it("returns Saturday 23:59:59.999 Pacific as UTC", () => {
    const anchor = new Date("2026-04-15T21:00:00.000Z");
    const end = coopEndOfWeek(anchor);
    expect(end.toISOString()).toBe("2026-04-19T06:59:59.999Z");
  });
});

describe("coopEndOfMonth returns full-month range (regression guard against host-tz fallthrough)", () => {
  it("April 2026 last day is 30, not 1", () => {
    const end = coopEndOfMonth(2026, 4);
    const lastDay = parseInt(coopFormatTimed(end, "d"), 10);
    expect(lastDay).toBe(30);
  });

  it("February 2026 last day is 28, not 1", () => {
    const end = coopEndOfMonth(2026, 2);
    const lastDay = parseInt(coopFormatTimed(end, "d"), 10);
    expect(lastDay).toBe(28);
  });

  it("December 2026 last day is 31, crosses year boundary correctly", () => {
    const end = coopEndOfMonth(2026, 12);
    const lastDay = parseInt(coopFormatTimed(end, "d"), 10);
    expect(lastDay).toBe(31);
  });
});

describe("utcEndOfMonth returns full-month range (regression guard)", () => {
  it("April 2026 UTC month ends on day 30", () => {
    const end = utcEndOfMonth(2026, 4);
    expect(end.getUTCDate()).toBe(30);
  });

  it("February 2024 (leap year) ends on day 29", () => {
    const end = utcEndOfMonth(2024, 2);
    expect(end.getUTCDate()).toBe(29);
  });

  it("December 2026 ends on day 31", () => {
    const end = utcEndOfMonth(2026, 12);
    expect(end.getUTCDate()).toBe(31);
  });
});

describe("coopStartOfMonth / coopEndOfMonth", () => {
  it("April 2026 starts at Apr 1 00:00 PDT = Apr 1 07:00 UTC", () => {
    const start = coopStartOfMonth(2026, 4);
    expect(start.toISOString()).toBe("2026-04-01T07:00:00.000Z");
  });

  it("April 2026 ends at Apr 30 23:59:59 PDT = May 1 06:59:59 UTC", () => {
    const end = coopEndOfMonth(2026, 4);
    expect(end.toISOString()).toBe("2026-05-01T06:59:59.000Z");
  });

  it("January 2026 starts at Jan 1 00:00 PST = Jan 1 08:00 UTC", () => {
    const start = coopStartOfMonth(2026, 1);
    expect(start.toISOString()).toBe("2026-01-01T08:00:00.000Z");
  });

  it("February 2026 has 28 days and end is at Feb 28 23:59:59 PST", () => {
    const end = coopEndOfMonth(2026, 2);
    expect(end.toISOString()).toBe("2026-03-01T07:59:59.000Z");
  });
});

describe("utcStartOfMonth / utcEndOfMonth (for all-day floating queries)", () => {
  it("April 2026 starts at Apr 1 00:00 UTC", () => {
    expect(utcStartOfMonth(2026, 4).toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("April 2026 ends at Apr 30 23:59:59.999 UTC", () => {
    expect(utcEndOfMonth(2026, 4).toISOString()).toBe("2026-04-30T23:59:59.999Z");
  });

  it("February 2026 ends at Feb 28 23:59:59.999 UTC", () => {
    expect(utcEndOfMonth(2026, 2).toISOString()).toBe("2026-02-28T23:59:59.999Z");
  });
});

describe("utcStartOfWeek / utcEndOfWeek", () => {
  it("Sunday 2026-04-12 anchors to week starting 2026-04-12", () => {
    const anchor = new Date("2026-04-15T00:00:00.000Z");
    const start = utcStartOfWeek(anchor);
    expect(start.toISOString()).toBe("2026-04-12T00:00:00.000Z");
  });

  it("end is exactly 7 days - 1ms from start", () => {
    const anchor = new Date("2026-04-15T00:00:00.000Z");
    const start = utcStartOfWeek(anchor);
    const end = utcEndOfWeek(anchor);
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000 - 1);
  });
});

describe("coopDayKey / floatingDayKey / localDayKey", () => {
  it("coopDayKey returns coop-zone date string for a timed event", () => {
    const instant = new Date("2026-04-15T21:00:00.000Z");
    expect(coopDayKey(instant)).toBe("2026-04-15");
  });

  it("coopDayKey respects coop-zone day boundary: Sat 23:00 PDT belongs to Saturday", () => {
    const satNight = new Date("2026-04-12T06:00:00.000Z");
    expect(coopDayKey(satNight)).toBe("2026-04-11");
  });

  it("floatingDayKey returns UTC date string for all-day events", () => {
    const allDay = new Date("2026-04-15T00:00:00.000Z");
    expect(floatingDayKey(allDay)).toBe("2026-04-15");
  });

  it("localDayKey returns local-components date string regardless of host TZ", () => {
    const d = new Date(2026, 3, 15);
    expect(localDayKey(d)).toBe("2026-04-15");
  });
});

describe("coopFormatTimed / coopFormatFloating", () => {
  it("coopFormatTimed renders an instant in COOP_TZ", () => {
    const instant = new Date("2026-04-15T21:00:00.000Z");
    expect(coopFormatTimed(instant, "h:mm a")).toBe("2:00 PM");
  });

  it("coopFormatFloating renders UTC components as-is", () => {
    const d = new Date("2026-04-15T00:00:00.000Z");
    expect(coopFormatFloating(d, "EEE, MMM d")).toBe("Wed, Apr 15");
  });

  it("coopFormatFloating is stable across host TZ", () => {
    const d = new Date("2026-04-15T00:00:00.000Z");
    expect(coopFormatFloating(d, "yyyy-MM-dd")).toBe("2026-04-15");
  });
});

describe("coopHourOfDay", () => {
  it("returns the Pacific hour of a UTC instant", () => {
    const instant = new Date("2026-04-15T21:00:00.000Z");
    expect(coopHourOfDay(instant)).toBe(14);
  });

  it("handles midnight Pacific", () => {
    const instant = new Date("2026-04-15T07:00:00.000Z");
    expect(coopHourOfDay(instant)).toBe(0);
  });

  it("handles 11pm Pacific from Saturday that's Sunday UTC", () => {
    const instant = new Date("2026-04-12T06:00:00.000Z");
    expect(coopHourOfDay(instant)).toBe(23);
  });
});

describe("eventDayKeys", () => {
  it("single-day timed event returns one key", () => {
    const keys = eventDayKeys({
      startDate: new Date("2026-04-15T21:00:00.000Z"),
      endDate: new Date("2026-04-15T22:00:00.000Z"),
      isAllDay: false,
    });
    expect(keys).toEqual(["2026-04-15"]);
  });

  it("multi-day timed event spanning 3 days returns 3 keys", () => {
    const keys = eventDayKeys({
      startDate: new Date("2026-04-15T17:00:00.000Z"),
      endDate: new Date("2026-04-17T17:00:00.000Z"),
      isAllDay: false,
    });
    expect(keys).toEqual(["2026-04-15", "2026-04-16", "2026-04-17"]);
  });

  it("all-day event uses UTC components", () => {
    const keys = eventDayKeys({
      startDate: new Date("2026-04-15T00:00:00.000Z"),
      endDate: new Date("2026-04-15T00:00:00.000Z"),
      isAllDay: true,
    });
    expect(keys).toEqual(["2026-04-15"]);
  });

  it("multi-day all-day event spanning a month boundary", () => {
    const keys = eventDayKeys({
      startDate: new Date("2026-04-30T00:00:00.000Z"),
      endDate: new Date("2026-05-02T00:00:00.000Z"),
      isAllDay: true,
    });
    expect(keys).toEqual(["2026-04-30", "2026-05-01", "2026-05-02"]);
  });
});

describe("coopSameDay", () => {
  it("two timed instants on the same coop day are same day", () => {
    const a = new Date("2026-04-15T16:00:00.000Z");
    const b = new Date("2026-04-15T23:00:00.000Z");
    expect(coopSameDay(a, b, false)).toBe(true);
  });

  it("Saturday 10pm PDT and Sunday 1am UTC-but-still-Saturday-PDT are same day", () => {
    const a = new Date("2026-04-12T05:00:00.000Z");
    const b = new Date("2026-04-12T06:30:00.000Z");
    expect(coopSameDay(a, b, false)).toBe(true);
  });

  it("two all-day instants on the same UTC day are same day", () => {
    const a = new Date("2026-04-15T00:00:00.000Z");
    const b = new Date("2026-04-15T00:00:00.000Z");
    expect(coopSameDay(a, b, true)).toBe(true);
  });
});

describe("parseTimeInput", () => {
  describe("with am/pm suffix", () => {
    it.each([
      ["2pm", 14, 0],
      ["2 pm", 14, 0],
      ["2PM", 14, 0],
      ["2:30pm", 14, 30],
      ["2:30 pm", 14, 30],
      ["2:30p", 14, 30],
      ["2p", 14, 0],
      ["12pm", 12, 0],
      ["12am", 0, 0],
      ["12:30am", 0, 30],
      ["1am", 1, 0],
      ["11:59pm", 23, 59],
      ["1:05 a", 1, 5],
      ["9:45am", 9, 45],
    ])("parses %s as %d:%d", (input, hour, minute) => {
      expect(parseTimeInput(input)).toEqual({ hour, minute });
    });
  });

  describe("24-hour without suffix", () => {
    it.each([
      ["14", 14, 0],
      ["14:30", 14, 30],
      ["1430", 14, 30],
      ["9", 9, 0],
      ["09", 9, 0],
      ["09:00", 9, 0],
      ["0900", 9, 0],
      ["0", 0, 0],
      ["00:00", 0, 0],
      ["23:59", 23, 59],
      ["2:37", 2, 37],
      ["230", 2, 30],
      ["2", 2, 0],
    ])("parses %s as %d:%d", (input, hour, minute) => {
      expect(parseTimeInput(input)).toEqual({ hour, minute });
    });
  });

  describe("rejects invalid input", () => {
    it.each([
      "",
      "   ",
      "abc",
      "25:00",
      "24:00",
      "14:60",
      "14:99",
      "13pm",
      "0pm",
      "0:30pm",
      "99",
      "12345",
      "pm",
      ":",
      ":30",
      "14:",
      "-1",
      "-1:00",
    ])("rejects %j", (input) => {
      expect(parseTimeInput(input)).toBeNull();
    });
  });

  describe("handles whitespace and casing", () => {
    it.each([
      [" 2pm ", 14, 0],
      ["  2:30 PM  ", 14, 30],
      ["2 : 30 pm", 14, 30],
      ["2Pm", 14, 0],
      ["2:30Am", 2, 30],
    ])("parses %j as %d:%d", (input, hour, minute) => {
      expect(parseTimeInput(input)).toEqual({ hour, minute });
    });
  });
});

describe("coopAddDays", () => {
  it("adds one calendar day across DST spring-forward", () => {
    const beforeSpringForward = coopWallClockToUtc(2026, 2, 7, 12, 0);
    const next = coopAddDays(beforeSpringForward, 1);
    expect(coopFormatTimed(next, "yyyy-MM-dd HH:mm")).toBe("2026-03-08 12:00");
  });

  it("adds one calendar day normally", () => {
    const d = coopWallClockToUtc(2026, 3, 15, 14, 0);
    const next = coopAddDays(d, 1);
    expect(coopFormatTimed(next, "yyyy-MM-dd HH:mm")).toBe("2026-04-16 14:00");
  });
});
