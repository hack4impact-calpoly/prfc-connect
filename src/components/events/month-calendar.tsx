"use client";

import { useMemo } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

type Props = {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  eventDates: Set<string>;
  onDayClick?: (date: Date) => void;
};

export function MonthCalendar({ currentMonth, onMonthChange, eventDates, onDayClick }: Props) {
  const components = useMemo(
    () => ({
      DayButton: ({ day, modifiers, className, ...rest }: DayButtonProps) => {
        const hasEvent = eventDates.has(format(day.date, "yyyy-MM-dd"));
        const { today, outside } = modifiers;
        return (
          <button
            {...rest}
            className={cn(
              "relative flex h-full w-full flex-col items-center justify-center rounded-md",
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
            {hasEvent && (
              <span
                className={cn("absolute bottom-1 h-1.5 w-1.5 rounded-full", today ? "bg-white" : "bg-prfc-red")}
                aria-hidden="true"
              />
            )}
          </button>
        );
      },
    }),
    [eventDates],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-baseline gap-2">
          <span className="font-angkor text-3xl text-prfc-red">{format(currentMonth, "MMMM")}</span>
          <span className="text-3xl text-prfc-brown">{format(currentMonth, "yyyy")}</span>
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            aria-label="Previous month"
            className="rounded-md p-2 hover:bg-paso-light-brown"
          >
            <ChevronLeft className="h-5 w-5 text-prfc-brown" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            aria-label="Next month"
            className="rounded-md p-2 hover:bg-paso-light-brown"
          >
            <ChevronRight className="h-5 w-5 text-prfc-brown" />
          </button>
        </div>
      </div>
      <DayPicker
        mode="single"
        month={currentMonth}
        onMonthChange={onMonthChange}
        onDayClick={onDayClick}
        weekStartsOn={0}
        showOutsideDays
        hideNavigation
        components={components}
        classNames={{
          month_grid: "w-full border-collapse",
          weekdays: "grid grid-cols-7",
          weekday: "py-2 text-center text-xs font-bold text-prfc-brown",
          week: "grid grid-cols-7",
          day: "aspect-square text-center",
        }}
      />
    </div>
  );
}
