"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SingleProps = {
  mode: "single";
  value: Date | null;
  onChange: (d: Date | null) => void;
  label: string;
  icon?: LucideIcon;
};

type RangeProps = {
  mode: "range";
  value: { start: Date | null; end: Date | null };
  onChange: (v: { start: Date | null; end: Date | null }) => void;
  label: string;
  icon?: LucideIcon;
};

export type DateTimePickerProps = SingleProps | RangeProps;

const TIME_SLOTS = buildTimeSlots();

function buildTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`;
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      slots.push({ value, label: `${hour12}:${mm} ${period}` });
    }
  }
  return slots;
}

function toTimeValue(d: Date | null): string | undefined {
  if (!d) return undefined;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function applyTime(base: Date, timeValue: string): Date {
  const [h, m] = timeValue.split(":").map(Number);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
}

function formatRange(start: Date | null, end: Date | null): string {
  if (!start || !end) return "";
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) {
    return `${format(start, "EEE, MMM d")} · ${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  }
  return `${format(start, "EEE, MMM d h:mm a")} - ${format(end, "MMM d h:mm a")}`;
}

export function DateTimePicker(props: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const Icon = props.icon;

  const displayValue =
    props.mode === "single"
      ? props.value
        ? format(props.value, "EEE, MMM d · h:mm a")
        : ""
      : formatRange(props.value.start, props.value.end);

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
      <PopoverContent className="w-auto p-0" align="start">
        {props.mode === "single" ? (
          <SinglePicker value={props.value} onChange={props.onChange} />
        ) : (
          <RangePicker value={props.value} onChange={props.onChange} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function SinglePicker({ value, onChange }: { value: Date | null; onChange: (d: Date | null) => void }) {
  return (
    <div className="p-3">
      <Calendar
        mode="single"
        selected={value ?? undefined}
        onSelect={(d) => {
          if (!d) {
            onChange(null);
            return;
          }
          const existing = value ?? new Date();
          onChange(new Date(d.getFullYear(), d.getMonth(), d.getDate(), existing.getHours(), existing.getMinutes()));
        }}
      />
      <div className="mt-3 border-t pt-3">
        <label className="mb-1 block text-xs font-semibold text-prfc-brown">Time</label>
        <Select
          value={toTimeValue(value)}
          onValueChange={(t) => {
            const base = value ?? new Date();
            onChange(applyTime(base, t));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {TIME_SLOTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function RangePicker({
  value,
  onChange,
}: {
  value: { start: Date | null; end: Date | null };
  onChange: (v: { start: Date | null; end: Date | null }) => void;
}) {
  const { start, end } = value;
  const baseDate = start ?? end ?? new Date();

  return (
    <div className="p-3">
      <Calendar
        mode="single"
        selected={start ?? undefined}
        onSelect={(d) => {
          if (!d) {
            onChange({ start: null, end: null });
            return;
          }
          const startHour = start ? start.getHours() : 9;
          const startMin = start ? start.getMinutes() : 0;
          const newStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startHour, startMin);
          const endHour = end ? end.getHours() : startHour + 1;
          const endMin = end ? end.getMinutes() : startMin;
          const newEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), endHour, endMin);
          onChange({ start: newStart, end: newEnd });
        }}
      />
      <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-prfc-brown">Start</label>
          <Select
            value={toTimeValue(start)}
            onValueChange={(t) => {
              const newStart = applyTime(start ?? baseDate, t);
              onChange({ start: newStart, end });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {TIME_SLOTS.map((s) => (
                <SelectItem key={`s-${s.value}`} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-prfc-brown">End</label>
          <Select
            value={toTimeValue(end)}
            onValueChange={(t) => {
              const newEnd = applyTime(end ?? baseDate, t);
              onChange({ start, end: newEnd });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {TIME_SLOTS.map((s) => (
                <SelectItem key={`e-${s.value}`} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
