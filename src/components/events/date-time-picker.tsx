"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeCombobox } from "@/components/events/time-combobox";
import {
  DEFAULT_EVENT_DURATION_MS,
  DEFAULT_EVENT_START_HOUR,
  type TimeOfDay,
  coopDateParts,
  coopFloatingDate,
  coopFormatFloating,
  coopFormatTimed,
  coopNow,
  coopSameDay,
  coopWallClockToUtc,
  floatingDateToLocal,
} from "@/utils/time";
import { cn } from "@/lib/utils";

type SingleProps = {
  mode: "single";
  value: Date | null;
  onChange: (d: Date | null) => void;
  label: string;
  icon?: LucideIcon;
  allDay?: boolean;
};

type RangeProps = {
  mode: "range";
  value: { start: Date | null; end: Date | null };
  onChange: (v: { start: Date | null; end: Date | null }) => void;
  label: string;
  icon?: LucideIcon;
  allDay?: boolean;
};

export type DateTimePickerProps = SingleProps | RangeProps;

function formatRange(start: Date | null, end: Date | null, allDay = false): string {
  if (!start || !end) return "";
  const sameDay = coopSameDay(start, end, allDay);
  if (allDay) {
    if (sameDay) return `${coopFormatFloating(start, "EEE, MMM d")} · All day`;
    return `${coopFormatFloating(start, "MMM d")} - ${coopFormatFloating(end, "MMM d")} · All day`;
  }
  if (sameDay) {
    return `${coopFormatTimed(start, "EEE, MMM d")} · ${coopFormatTimed(start, "h:mm a")} - ${coopFormatTimed(end, "h:mm a")}`;
  }
  return `${coopFormatTimed(start, "EEE, MMM d h:mm a")} - ${coopFormatTimed(end, "MMM d h:mm a")}`;
}

export function DateTimePicker(props: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const Icon = props.icon;

  const allDay = props.allDay ?? false;
  const displayValue =
    props.mode === "single"
      ? props.value
        ? allDay
          ? coopFormatFloating(props.value, "EEE, MMM d")
          : coopFormatTimed(props.value, "EEE, MMM d · h:mm a")
        : ""
      : formatRange(props.value.start, props.value.end, allDay);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-prfc-border/30 bg-paso-grey px-4 py-3 text-left hover:bg-paso-light-brown/40"
        >
          {Icon && <Icon className="h-5 w-5 shrink-0 text-prfc-brown" />}
          <span className={cn("flex-1 text-sm", displayValue ? "text-foreground" : "text-muted-foreground")}>
            {displayValue || props.label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        {props.mode === "single" ? (
          <SinglePicker value={props.value} onChange={props.onChange} allDay={allDay} />
        ) : (
          <RangePicker value={props.value} onChange={props.onChange} allDay={allDay} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function SinglePicker({
  value,
  onChange,
  allDay,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
  allDay: boolean;
}) {
  const valueParts = value ? (allDay ? null : coopDateParts(value)) : null;
  const selectedLocal = value
    ? allDay
      ? floatingDateToLocal(value)
      : new Date(valueParts!.year, valueParts!.month0, valueParts!.day)
    : undefined;

  const handleTimeCommit = (parsed: TimeOfDay) => {
    const now = coopNow();
    const base = value ? coopDateParts(value) : { year: now.year, month0: now.month0, day: now.day };
    onChange(coopWallClockToUtc(base.year, base.month0, base.day, parsed.hour, parsed.minute));
  };

  return (
    <div className="p-3">
      {!allDay && (
        <div className="mb-3 border-b pb-3">
          <label className="mb-1 block text-xs font-semibold text-prfc-brown">Time</label>
          <TimeCombobox value={value} onCommit={handleTimeCommit} ariaLabel="Time" />
        </div>
      )}
      <Calendar
        mode="single"
        selected={selectedLocal}
        onSelect={(d) => {
          if (!d) {
            onChange(null);
            return;
          }
          if (allDay) {
            onChange(coopFloatingDate(d.getFullYear(), d.getMonth(), d.getDate()));
            return;
          }
          const existingHour = valueParts?.hour ?? DEFAULT_EVENT_START_HOUR;
          const existingMinute = valueParts?.minute ?? 0;
          onChange(coopWallClockToUtc(d.getFullYear(), d.getMonth(), d.getDate(), existingHour, existingMinute));
        }}
      />
    </div>
  );
}

function RangePicker({
  value,
  onChange,
  allDay,
}: {
  value: { start: Date | null; end: Date | null };
  onChange: (v: { start: Date | null; end: Date | null }) => void;
  allDay: boolean;
}) {
  const { start, end } = value;
  const startParts = start ? (allDay ? null : coopDateParts(start)) : null;

  const anchorLocal = start
    ? allDay
      ? floatingDateToLocal(start)
      : new Date(startParts!.year, startParts!.month0, startParts!.day)
    : undefined;

  const handleStartCommit = (parsed: TimeOfDay) => {
    const now = coopNow();
    const base = start
      ? coopDateParts(start)
      : end
        ? coopDateParts(end)
        : { year: now.year, month0: now.month0, day: now.day };
    const newStart = coopWallClockToUtc(base.year, base.month0, base.day, parsed.hour, parsed.minute);
    const prevDuration =
      start && end && end.getTime() > start.getTime() ? end.getTime() - start.getTime() : DEFAULT_EVENT_DURATION_MS;
    const newEnd = new Date(newStart.getTime() + prevDuration);
    onChange({ start: newStart, end: newEnd });
  };

  const handleEndCommit = (parsed: TimeOfDay) => {
    const now = coopNow();
    const base = end
      ? coopDateParts(end)
      : start
        ? coopDateParts(start)
        : { year: now.year, month0: now.month0, day: now.day };
    const newEnd = coopWallClockToUtc(base.year, base.month0, base.day, parsed.hour, parsed.minute);
    onChange({ start, end: newEnd });
  };

  return (
    <div className="p-3">
      {!allDay && (
        <div className="mb-3 grid grid-cols-2 gap-3 border-b pb-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-prfc-brown">Start</label>
            <TimeCombobox value={start} onCommit={handleStartCommit} ariaLabel="Start time" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-prfc-brown">End</label>
            <TimeCombobox value={end} onCommit={handleEndCommit} ariaLabel="End time" />
          </div>
        </div>
      )}
      <Calendar
        mode="single"
        selected={anchorLocal}
        onSelect={(d) => {
          if (!d) {
            onChange({ start: null, end: null });
            return;
          }
          if (allDay) {
            const floating = coopFloatingDate(d.getFullYear(), d.getMonth(), d.getDate());
            onChange({ start: floating, end: floating });
            return;
          }
          const startHour = startParts?.hour ?? DEFAULT_EVENT_START_HOUR;
          const startMin = startParts?.minute ?? 0;
          const newStart = coopWallClockToUtc(d.getFullYear(), d.getMonth(), d.getDate(), startHour, startMin);
          const prevDuration =
            start && end && end.getTime() > start.getTime()
              ? end.getTime() - start.getTime()
              : DEFAULT_EVENT_DURATION_MS;
          const newEnd = new Date(newStart.getTime() + prevDuration);
          onChange({ start: newStart, end: newEnd });
        }}
      />
    </div>
  );
}
