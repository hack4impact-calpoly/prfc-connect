"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-prfc-brown",
        nav: "flex items-center gap-1",
        button_previous: "inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-paso-light-brown",
        button_next: "inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-paso-light-brown",
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7",
        weekday: "text-xs font-medium text-muted-foreground py-2 text-center",
        week: "grid grid-cols-7",
        day: "aspect-square p-0 text-center",
        day_button:
          "h-9 w-9 rounded-md hover:bg-paso-light-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prfc-red",
        today: "bg-prfc-red text-white rounded-md",
        selected: "bg-prfc-brown text-white rounded-md",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-30",
        ...classNames,
      }}
      {...props}
    />
  );
}
