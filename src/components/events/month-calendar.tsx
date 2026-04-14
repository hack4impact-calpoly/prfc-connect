"use client";

import { useMemo } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths } from "date-fns";
import { coopDateParts, coopFormatTimed, localDayKey } from "@/lib/time";
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
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-baseline gap-2">
          <span className="font-angkor text-3xl text-prfc-red">{coopFormatTimed(currentMonth, "MMMM")}</span>
          <span className="text-3xl text-prfc-brown">{coopFormatTimed(currentMonth, "yyyy")}</span>
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(localMonth, 1))}
            aria-label="Previous month"
            className="rounded-md p-2 hover:bg-paso-light-brown"
          >
            <ChevronLeft className="h-5 w-5 text-prfc-brown" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(localMonth, 1))}
            aria-label="Next month"
            className="rounded-md p-2 hover:bg-paso-light-brown"
          >
            <ChevronRight className="h-5 w-5 text-prfc-brown" />
          </button>
        </div>
      </div>
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
        classNames={{
          month_grid: "w-full border-collapse",
          weekdays: "grid grid-cols-7",
          weekday: "py-2 text-center text-xs font-bold text-prfc-brown",
          week: "grid grid-cols-7",
          day: "h-28 text-center",
        }}
      />
    </div>
  );
}
