"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_EVENT_START_HOUR,
  TIME_SLOTS,
  type TimeOfDay,
  type TimeSlot,
  coopFormatTimed,
  formatCoopTimeValue,
  parseTimeInput,
} from "@/utils/time";
import { cn } from "@/lib/utils";

type Props = {
  value: Date | null;
  onCommit: (parsed: TimeOfDay) => void;
  ariaLabel: string;
};

const WINDOW_SIZE = 5;
const SLOTS_BEFORE_ANCHOR = 2;

function windowAroundAnchor(anchorIndex: number): readonly TimeSlot[] {
  const idealStart = anchorIndex - SLOTS_BEFORE_ANCHOR;
  const maxStart = Math.max(0, TIME_SLOTS.length - WINDOW_SIZE);
  const start = Math.max(0, Math.min(maxStart, idealStart));
  return TIME_SLOTS.slice(start, start + WINDOW_SIZE);
}

export function TimeCombobox({ value, onCommit, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const displayValue = value ? coopFormatTimed(value, "h:mm a") : "";
  const inputValue = typed ?? displayValue;

  const displayedSlots = useMemo<readonly TimeSlot[]>(() => {
    if (typed !== null && typed !== "") {
      const needle = typed.trim().toLowerCase().replace(/\s+/g, "");
      if (needle) {
        const matches = TIME_SLOTS.filter((s) => {
          const label = s.label.toLowerCase().replace(/\s+/g, "");
          return label.startsWith(needle) || s.value.startsWith(needle);
        });
        if (matches.length > 0) return matches.slice(0, WINDOW_SIZE);
      }
    }
    const anchorValue = formatCoopTimeValue(value) ?? `${String(DEFAULT_EVENT_START_HOUR).padStart(2, "0")}:00`;
    const anchorIndex = TIME_SLOTS.findIndex((s) => s.value === anchorValue);
    return windowAroundAnchor(anchorIndex >= 0 ? anchorIndex : 0);
  }, [typed, value]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapperRef.current?.contains(target)) return;
      setOpen(false);
      setTyped(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const commitParsed = (parsed: TimeOfDay) => {
    onCommit(parsed);
    setTyped(null);
    setOpen(false);
  };

  const commitTyped = () => {
    if (typed === null) return;
    const parsed = parseTimeInput(typed);
    if (parsed) commitParsed(parsed);
    else setTyped(null);
  };

  const commitSlot = (slotValue: string) => {
    const [h, m] = slotValue.split(":").map(Number);
    commitParsed({ hour: h, minute: m });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="text"
        size={1}
        value={inputValue}
        onChange={(e) => {
          setTyped(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={(e) => e.currentTarget.select()}
        onClick={() => {
          if (!open) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (open) commitTyped();
            setOpen(false);
          } else if (e.key === "Escape") {
            e.preventDefault();
            setTyped(null);
            setOpen(false);
          } else if (e.key === "ArrowDown") {
            if (!open) {
              e.preventDefault();
              setOpen(true);
            }
          }
        }}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls="time-combobox-list"
        role="combobox"
        placeholder="Time"
        className="h-9 min-w-0"
      />
      {open && (
        <div
          id="time-combobox-list"
          role="listbox"
          className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-prfc-border/30 bg-popover py-1 shadow-md"
        >
          {displayedSlots.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No matching time</p>
          ) : (
            displayedSlots.map((s) => {
              const isSelected = formatCoopTimeValue(value) === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitSlot(s.value);
                  }}
                  className={cn(
                    "block w-full px-3 py-1.5 text-left text-sm hover:bg-muted",
                    isSelected && "bg-muted font-semibold",
                  )}
                >
                  {s.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
