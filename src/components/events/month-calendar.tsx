"use client";

import { useMemo } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { coopDateParts, localDayKey } from "@/utils/time";
import { cn } from "@/lib/utils";

export type DayMarker = { allDayCount: number; timedCount: number };

type Props = {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  eventsByDate: Map<string, DayMarker>;
  onDayClick?: (date: Date) => void;
};

const MAX_MARKERS_PER_TYPE = 2;

export function MonthCalendar({ currentMonth, onMonthChange, eventsByDate, onDayClick }: Props) {
  const localMonth = useMemo(() => {
    const { year, month0 } = coopDateParts(currentMonth);
    return new Date(year, month0, 1);
  }, [currentMonth]);

  const components = useMemo(
    () => ({
      DayButton: ({ day, modifiers, className, ...rest }: DayButtonProps) => {
        const marker = eventsByDate.get(localDayKey(day.date));
        const { today, outside } = modifiers;
        return (
          <button
            {...rest}
            className={cn(
              "flex h-full w-full flex-col items-center justify-start rounded-md pt-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prfc-red",
              className,
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm",
                today && "bg-prfc-red font-semibold text-white",
                outside && !today && "text-muted-foreground",
                !today && !outside && "text-foreground",
              )}
            >
              {day.date.getDate()}
            </span>
            {marker && (marker.allDayCount > 0 || marker.timedCount > 0) && (
              <div className="mt-2 flex flex-col items-center gap-1.5">
                {Array.from({ length: Math.min(marker.allDayCount, MAX_MARKERS_PER_TYPE) }).map((_, i) => (
                  <span key={`bar-${i}`} className="h-1 w-5 rounded-full bg-prfc-red" aria-hidden="true" />
                ))}
                {Array.from({ length: Math.min(marker.timedCount, MAX_MARKERS_PER_TYPE) }).map((_, i) => (
                  <span key={`dot-${i}`} className="h-1.5 w-1.5 rounded-full bg-prfc-red" aria-hidden="true" />
                ))}
                {(() => {
                  const overflow =
                    Math.max(0, marker.allDayCount - MAX_MARKERS_PER_TYPE) +
                    Math.max(0, marker.timedCount - MAX_MARKERS_PER_TYPE);
                  return overflow > 0 ? (
                    <span className="text-[10px] font-semibold text-prfc-red">+{overflow}</span>
                  ) : null;
                })()}
              </div>
            )}
          </button>
        );
      },
    }),
    [eventsByDate],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DayPicker
        mode="single"
        month={localMonth}
        onMonthChange={onMonthChange}
        onDayClick={onDayClick}
        weekStartsOn={0}
        showOutsideDays
        fixedWeeks
        hideNavigation
        components={components}
        formatters={{ formatWeekdayName: (date) => date.toLocaleDateString("en-US", { weekday: "short" }) }}
        classNames={{
          root: "flex min-h-0 flex-1 flex-col",
          month_caption: "hidden",
          months: "flex min-h-0 flex-1 flex-col",
          month: "flex min-h-0 flex-1 flex-col",
          month_grid: "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border-t border-l border-border",
          weeks: "flex min-h-0 flex-1 flex-col",
          weekdays: "grid grid-cols-7",
          weekday: "border-r border-border py-2 text-center text-xs font-bold text-prfc-brown",
          week: "grid min-h-0 flex-1 grid-cols-7",
          day: "overflow-hidden border-r border-b border-border text-center",
        }}
      />
    </div>
  );
}
