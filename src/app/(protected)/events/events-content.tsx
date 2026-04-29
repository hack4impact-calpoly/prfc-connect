"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WeekCalendar } from "@/components/events/week-calendar";
import { MonthCalendar } from "@/components/events/month-calendar";
import { CreateEventPopover } from "@/components/events/create-event-popover";
import type { GroupOption, MemberOption } from "@/components/events/invitee-combobox";
import { fetchEventDetail, fetchEventsForMonth, fetchEventsForWeek } from "@/actions/event";
import { EventSummarySchema, EventWithRsvpCountSchema } from "@/schema/event";
import type { EventSummary, EventWithRsvpCount } from "@/services/event";
import type { GroupWithMemberIds } from "@/services/contact-group";
import type { MemberSummary } from "@/lib/api/member-api";
import type { EventType } from "@/generated/prisma/client";
import {
  DEFAULT_EVENT_START_HOUR,
  coopAddDays,
  coopDateParts,
  coopFloatingDate,
  coopFormatFloating,
  coopFormatTimed,
  coopNow,
  coopStartOfWeek,
  coopWallClockToUtc,
  eventDayKeys,
  floatingDayKey,
} from "@/utils/time";
import { cn } from "@/lib/utils";

type Props = {
  initialDateIso: string;
  initialWeekEvents: EventSummary[];
  groups: GroupWithMemberIds[];
  members: MemberSummary[];
  currentUserOwnerid: number;
  isAdmin: boolean;
};

const EventSummaryArraySchema = EventSummarySchema.array();

function parseEvents(events: unknown): EventSummary[] {
  return EventSummaryArraySchema.parse(events) as EventSummary[];
}

function buildWeekHeading(anchor: Date) {
  const start = coopStartOfWeek(anchor);
  const end = coopAddDays(start, 6);
  return {
    rangeLabel: `${coopFormatTimed(start, "MMM d")} - ${coopFormatTimed(end, "MMM d")}`,
    year: coopFormatTimed(end, "yyyy"),
  };
}

export function EventsContent({
  initialDateIso,
  initialWeekEvents,
  groups,
  members,
  currentUserOwnerid,
  isAdmin,
}: Props) {
  const initialSelected = useMemo(() => {
    const d = new Date(initialDateIso);
    const y = parseInt(coopFormatTimed(d, "yyyy"), 10);
    const m = parseInt(coopFormatTimed(d, "M"), 10);
    const day = parseInt(coopFormatTimed(d, "d"), 10);
    return coopFloatingDate(y, m - 1, day);
  }, [initialDateIso]);

  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(initialDateIso));
  const [weekEvents, setWeekEvents] = useState<EventSummary[]>(() => parseEvents(initialWeekEvents));
  const [monthEvents, setMonthEvents] = useState<EventSummary[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<Date>(initialSelected);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<Date | undefined>();
  const [editingEvent, setEditingEvent] = useState<EventWithRsvpCount | null>(null);
  const [editingInviteeIds, setEditingInviteeIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const groupOptions: GroupOption[] = useMemo(
    () =>
      groups.map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        memberIds: g.memberIds,
      })),
    [groups],
  );
  const memberOptions: MemberOption[] = useMemo(
    () => members.map((m) => ({ ownerid: m.ownerid, ownername: m.ownername })),
    [members],
  );
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { allDayCount: number; timedCount: number }>();
    for (const e of monthEvents) {
      for (const key of eventDayKeys(e)) {
        const existing = map.get(key) ?? { allDayCount: 0, timedCount: 0 };
        if (e.isAllDay) existing.allDayCount += 1;
        else existing.timedCount += 1;
        map.set(key, existing);
      }
    }
    return map;
  }, [monthEvents]);
  const selectedDayKey = useMemo(() => floatingDayKey(selectedDay), [selectedDay]);
  const selectedDayEvents = useMemo(
    () => monthEvents.filter((e) => eventDayKeys(e).includes(selectedDayKey)),
    [monthEvents, selectedDayKey],
  );
  const weekHeading = useMemo(() => buildWeekHeading(currentDate), [currentDate]);

  useEffect(() => {
    if (view !== "month") return;
    const groupId = groupFilter === "all" ? undefined : Number(groupFilter);
    const eventType = typeFilter === "all" ? undefined : (typeFilter as EventType);
    const { year, month0 } = coopDateParts(currentDate);
    startTransition(async () => {
      const result = await fetchEventsForMonth(year, month0 + 1, { eventType, groupId });
      if (result.success && result.data) {
        setMonthEvents(parseEvents(result.data));
      } else if (!result.success) {
        toast.error(result.error ?? "Failed to load events");
      }
    });
  }, [view, currentDate, groupFilter, typeFilter]);

  const refetchWeek = (anchor: Date) => {
    startTransition(async () => {
      const result = await fetchEventsForWeek(coopStartOfWeek(anchor));
      if (result.success && result.data) {
        setWeekEvents(parseEvents(result.data));
      } else if (!result.success) {
        toast.error(result.error ?? "Failed to load events");
      }
    });
  };

  const refetchMonth = (anchor: Date) => {
    const groupId = groupFilter === "all" ? undefined : Number(groupFilter);
    const eventType = typeFilter === "all" ? undefined : (typeFilter as EventType);
    const { year, month0 } = coopDateParts(anchor);
    startTransition(async () => {
      const result = await fetchEventsForMonth(year, month0 + 1, { eventType, groupId });
      if (result.success && result.data) {
        setMonthEvents(parseEvents(result.data));
      } else if (!result.success) {
        toast.error(result.error ?? "Failed to load events");
      }
    });
  };

  const advanceMonth = (delta: number): Date => {
    const { year, month0 } = coopDateParts(currentDate);
    const nextMonth0 = month0 + delta;
    const nextYear = year + Math.floor(nextMonth0 / 12);
    const normalizedMonth0 = ((nextMonth0 % 12) + 12) % 12;
    return coopWallClockToUtc(nextYear, normalizedMonth0, 1, 12, 0);
  };

  const goPrev = () => {
    if (view === "week") {
      const next = coopAddDays(currentDate, -7);
      setCurrentDate(next);
      refetchWeek(next);
    } else {
      setCurrentDate(advanceMonth(-1));
    }
  };

  const goNext = () => {
    if (view === "week") {
      const next = coopAddDays(currentDate, 7);
      setCurrentDate(next);
      refetchWeek(next);
    } else {
      setCurrentDate(advanceMonth(1));
    }
  };

  const handleDayClickInMonth = (day: Date) => {
    setSelectedDay(coopFloatingDate(day.getFullYear(), day.getMonth(), day.getDate()));
  };

  const handleTimeSlotClick = (start: Date) => {
    setEditingEvent(null);
    setCreateDefaultDate(start);
    setCreateOpen(true);
  };

  const handleEventClick = (eventId: number) => {
    startTransition(async () => {
      const result = await fetchEventDetail(eventId);
      if (result.success && result.data) {
        const parsed = EventWithRsvpCountSchema.parse(result.data.event) as EventWithRsvpCount;
        setEditingEvent(parsed);
        setEditingInviteeIds(result.data.inviteeMemberIds);
        setCreateDefaultDate(undefined);
        setCreateOpen(true);
      } else if (!result.success) {
        toast.error(result.error ?? "Failed to load event details");
      }
    });
  };

  const handleCreateButtonClick = () => {
    setEditingEvent(null);
    setEditingInviteeIds([]);
    const now = coopNow();
    setCreateDefaultDate(coopWallClockToUtc(now.year, now.month0, now.day, DEFAULT_EVENT_START_HOUR, 0));
    setCreateOpen(true);
  };

  const handleDialogOpenChange = (next: boolean) => {
    setCreateOpen(next);
    if (!next) {
      setEditingEvent(null);
      setEditingInviteeIds([]);
    }
  };

  const handleSaved = () => {
    setCreateOpen(false);
    setEditingEvent(null);
    setEditingInviteeIds([]);
    if (view === "week") {
      refetchWeek(currentDate);
    } else {
      refetchMonth(currentDate);
    }
  };

  const handleDeleted = () => {
    setCreateOpen(false);
    setEditingEvent(null);
    setEditingInviteeIds([]);
    if (view === "week") {
      refetchWeek(currentDate);
    } else {
      refetchMonth(currentDate);
    }
  };

  const canEditCurrent = editingEvent ? isAdmin || editingEvent.ownerid === currentUserOwnerid : true;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {view === "week" && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous week"
              className="rounded-md p-2 hover:bg-paso-light-brown"
            >
              <ChevronLeft className="h-5 w-5 text-prfc-brown" />
            </button>
            <h1 className="flex items-baseline gap-2">
              <span className="font-angkor text-3xl text-prfc-red">{weekHeading.rangeLabel}</span>
              <span className="text-3xl text-prfc-brown">{weekHeading.year}</span>
            </h1>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next week"
              className="rounded-md p-2 hover:bg-paso-light-brown"
            >
              <ChevronRight className="h-5 w-5 text-prfc-brown" />
            </button>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          <Select value={view} onValueChange={(v) => setView(v as "week" | "month")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreateButtonClick} className="bg-prfc-red text-white hover:bg-prfc-red/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      <div className={cn("isolate transition-opacity", isPending && "pointer-events-none opacity-60")}>
        {view === "week" ? (
          <div className="h-[700px]">
            <WeekCalendar
              events={weekEvents}
              selectedDate={currentDate}
              onTimeSlotClick={handleTimeSlotClick}
              onEventClick={handleEventClick}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="mb-4 flex flex-wrap gap-3">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <MonthCalendar
                currentMonth={currentDate}
                onMonthChange={(d) => setCurrentDate(coopWallClockToUtc(d.getFullYear(), d.getMonth(), 1, 12, 0))}
                eventsByDate={eventsByDate}
                onDayClick={handleDayClickInMonth}
              />
            </div>
            <aside className="rounded-lg border border-prfc-border/30 bg-white p-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-prfc-brown">
                Events for {coopFormatTimed(currentDate, "MMMM")}
              </h2>
              <p className="mt-2 font-angkor text-5xl text-prfc-red">{coopFormatFloating(selectedDay, "d")}</p>
              <p className="text-sm text-muted-foreground">{coopFormatFloating(selectedDay, "EEEE, MMMM d")}</p>
              <div className="mt-4 space-y-2">
                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events on this day.</p>
                ) : (
                  selectedDayEvents.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => handleEventClick(e.id)}
                      className="w-full rounded-md border border-prfc-border/20 p-2 text-left hover:bg-paso-grey"
                    >
                      <p className="text-base font-semibold">{e.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {e.isAllDay
                          ? "All day"
                          : `${coopFormatTimed(e.startDate, "h:mm a")} - ${coopFormatTimed(e.endDate, "h:mm a")}`}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-[820px] gap-0 p-0">
          <CreateEventPopover
            key={editingEvent?.id ?? "create"}
            onClose={() => handleDialogOpenChange(false)}
            defaultDate={createDefaultDate}
            groups={groupOptions}
            members={memberOptions}
            onSaved={handleSaved}
            editingEvent={editingEvent ?? undefined}
            initialMemberIds={editingInviteeIds}
            canEdit={canEditCurrent}
            onDeleted={handleDeleted}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
