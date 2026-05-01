"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Clock, MapPin, CalendarCheck, List, Loader2, Trash2 } from "lucide-react";
import { handleActionError } from "@/utils/auth-redirect";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/events/date-time-picker";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InviteeCombobox, type GroupOption, type MemberOption } from "@/components/events/invitee-combobox";
import { createEventAction, deleteEventAction, updateEventAction } from "@/actions/event";
import {
  DEFAULT_EVENT_DURATION_MS,
  DEFAULT_EVENT_START_HOUR,
  coopAddDays,
  coopDateParts,
  coopFloatingDate,
  coopWallClockToUtc,
} from "@/utils/time";
import { cn } from "@/lib/utils";
import type { EventType } from "@/generated/prisma/client";
import type { EventWithRsvpCount } from "@/services/event";

type Props = {
  onClose: () => void;
  defaultDate?: Date;
  groups: GroupOption[];
  members: MemberOption[];
  onSaved?: (eventId: number) => void;
  editingEvent?: EventWithRsvpCount;
  initialMemberIds?: number[];
  canEdit?: boolean;
  onDeleted?: (eventId: number) => void;
};

const EVENT_TYPES: { value: EventType; label: string; dot: string }[] = [
  { value: "social", label: "Social", dot: "bg-prfc-brown" },
  { value: "networking", label: "Networking", dot: "bg-amber-600" },
  { value: "meeting", label: "Meeting", dot: "bg-prfc-red" },
  { value: "volunteer", label: "Volunteer", dot: "bg-green-700" },
];

const RSVP_DEFAULT_DAYS_BEFORE = 3;

function computeDefaultRsvpDeadline(start: Date | null): Date | null {
  if (!start) return null;
  const threeDaysBefore = coopAddDays(start, -RSVP_DEFAULT_DAYS_BEFORE);
  const { year, month0, day } = coopDateParts(threeDaysBefore);
  const deadline = coopWallClockToUtc(year, month0, day, 23, 59, 59);
  if (deadline.getTime() < Date.now()) return null;
  return deadline;
}

export function CreateEventPopover({
  onClose,
  defaultDate,
  groups,
  members,
  onSaved,
  editingEvent,
  initialMemberIds,
  canEdit = true,
  onDeleted,
}: Props) {
  const isEditMode = editingEvent !== undefined;
  const readOnly = isEditMode && !canEdit;
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [eventType, setEventType] = useState<EventType>(editingEvent?.eventType ?? "social");
  const [isAllDay, setIsAllDay] = useState<boolean>(editingEvent?.isAllDay ?? false);
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>(() => {
    if (editingEvent) {
      return { start: editingEvent.startDate, end: editingEvent.endDate };
    }
    if (defaultDate) {
      return { start: defaultDate, end: new Date(defaultDate.getTime() + DEFAULT_EVENT_DURATION_MS) };
    }
    return { start: null, end: null };
  });
  const [location, setLocation] = useState(editingEvent?.location ?? "");
  const [manualRsvpDeadline, setManualRsvpDeadline] = useState<Date | null>(editingEvent?.rsvpDeadline ?? null);
  const [rsvpDeadlineTouched, setRsvpDeadlineTouched] = useState<boolean>(() => editingEvent !== undefined);
  const rsvpDeadline = rsvpDeadlineTouched ? manualRsvpDeadline : computeDefaultRsvpDeadline(range.start);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(() => new Set(initialMemberIds ?? []));

  const selectedGroupIds = useMemo(() => {
    const result = new Set<number>();
    for (const g of groups) {
      if (g.memberIds.length === 0) continue;
      if (g.memberIds.every((mid) => selectedMemberIds.has(mid))) {
        result.add(g.id);
      }
    }
    return result;
  }, [groups, selectedMemberIds]);
  const [description, setDescription] = useState(editingEvent?.description ?? "");
  const [error, setError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!readOnly) titleRef.current?.focus();
  }, [readOnly]);

  const toggleGroup = (id: number) => {
    const group = groups.find((g) => g.id === id);
    if (!group || group.memberIds.length === 0) return;
    const allSelected = group.memberIds.every((mid) => selectedMemberIds.has(mid));
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const mid of group.memberIds) next.delete(mid);
      } else {
        for (const mid of group.memberIds) next.add(mid);
      }
      return next;
    });
  };

  const toggleMember = (id: number) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      titleRef.current?.focus();
      return;
    }
    if (!range.start || !range.end) {
      setError("Date and time are required");
      return;
    }
    if (isAllDay ? range.end < range.start : range.end <= range.start) {
      setError(isAllDay ? "End date must be on or after start date" : "End time must be after start time");
      return;
    }

    startTransition(async () => {
      if (isEditMode) {
        const result = await updateEventAction(editingEvent.id, {
          title: title.trim(),
          eventType,
          startDate: range.start!,
          endDate: range.end!,
          isAllDay,
          location: location.trim() || null,
          description: description.trim() || null,
          rsvpDeadline,
          memberIds: Array.from(selectedMemberIds),
        });
        if (result.success) {
          toast.success("Event updated");
          onSaved?.(editingEvent.id);
          onClose();
        } else {
          const message = handleActionError(result.error, "Failed to update event");
          toast.error(message);
          setError(message);
        }
        return;
      }

      const result = await createEventAction({
        title: title.trim(),
        eventType,
        startDate: range.start!,
        endDate: range.end!,
        isAllDay,
        location: location.trim() || null,
        description: description.trim() || null,
        rsvpDeadline: rsvpDeadline,
        memberIds: Array.from(selectedMemberIds),
      });
      if (result.success) {
        toast.success("Event created");
        onSaved?.(result.data!.id);
        onClose();
      } else {
        const message = handleActionError(result.error, "Failed to create event");
        toast.error(message);
        setError(message);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!editingEvent) return;
    startTransition(async () => {
      const result = await deleteEventAction(editingEvent.id);
      if (result.success) {
        toast.success("Event deleted");
        onDeleted?.(editingEvent.id);
        setConfirmDeleteOpen(false);
        onClose();
      } else {
        const message = handleActionError(result.error, "Failed to delete event");
        toast.error(message);
        setError(message);
        setConfirmDeleteOpen(false);
      }
    });
  };

  const headingSrText = isEditMode ? (readOnly ? "View event" : "Edit event") : "Create event";
  const primaryButtonLabel = isEditMode ? "Save Changes" : "Save";

  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden bg-white">
      <DialogTitle className="sr-only">{headingSrText}</DialogTitle>
      <DialogDescription className="sr-only">
        {readOnly
          ? "View event details."
          : isEditMode
            ? "Update the event details and click Save Changes."
            : "Fill in the event details and click Save to create a new event."}
      </DialogDescription>
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New Event Title"
          maxLength={200}
          disabled={readOnly}
          className="w-full border-none bg-transparent font-angkor text-3xl text-prfc-red outline-none placeholder:text-foreground disabled:cursor-default disabled:opacity-100"
          aria-label="Event title"
        />

        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((type) => {
            const isSelected = eventType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => !readOnly && setEventType(type.value)}
                disabled={readOnly}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                  isSelected
                    ? "border-prfc-brown bg-paso-light-brown text-prfc-brown"
                    : "border-prfc-border/40 text-muted-foreground hover:bg-paso-grey",
                  readOnly && "cursor-default",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", type.dot)} />
                {type.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={isAllDay}
            onCheckedChange={(checked) => {
              const next = checked === true;
              setIsAllDay(next);
              if (!range.start) return;
              const startParts = coopDateParts(range.start);
              const endParts = range.end ? coopDateParts(range.end) : startParts;
              if (next) {
                const newStart = coopFloatingDate(startParts.year, startParts.month0, startParts.day);
                const newEnd = coopFloatingDate(endParts.year, endParts.month0, endParts.day);
                setRange({ start: newStart, end: newEnd });
              } else {
                const newStart = coopWallClockToUtc(
                  startParts.year,
                  startParts.month0,
                  startParts.day,
                  DEFAULT_EVENT_START_HOUR,
                  0,
                );
                const newEnd = new Date(newStart.getTime() + DEFAULT_EVENT_DURATION_MS);
                setRange({ start: newStart, end: newEnd });
              }
            }}
            disabled={readOnly}
          />
          <span className="text-foreground">All day</span>
        </label>

        <DateTimePicker
          mode="range"
          label={isAllDay ? "Date" : "Date and time"}
          icon={Clock}
          value={range}
          onChange={setRange}
          allDay={isAllDay}
        />

        <div className="flex items-center gap-3 rounded-lg border border-prfc-border/30 bg-paso-grey px-4 py-3">
          <MapPin className="h-5 w-5 shrink-0 text-prfc-brown" />
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add Location"
            maxLength={200}
            disabled={readOnly}
            className="border-none bg-transparent p-0 shadow-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
          />
        </div>

        <DateTimePicker
          mode="single"
          label="RSVP Deadline"
          icon={CalendarCheck}
          value={rsvpDeadline}
          onChange={(d) => {
            setManualRsvpDeadline(d);
            setRsvpDeadlineTouched(true);
          }}
        />

        <InviteeCombobox
          groups={groups}
          members={members}
          selectedGroupIds={selectedGroupIds}
          selectedMemberIds={selectedMemberIds}
          onToggleGroup={toggleGroup}
          onToggleMember={toggleMember}
        />

        <div className="flex items-start gap-3 rounded-lg border border-prfc-border/30 bg-paso-grey px-4 py-3">
          <List className="mt-2 h-5 w-5 shrink-0 text-prfc-brown" />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description"
            maxLength={5000}
            rows={3}
            disabled={readOnly}
            className="min-h-[80px] border-none bg-transparent p-0 shadow-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-prfc-border/30 bg-white px-6 py-4">
        {isEditMode && canEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={isPending}
            className="mr-auto border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-prfc-brown text-white hover:bg-prfc-dark-brown"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {primaryButtonLabel}
          </Button>
        )}
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the event and cancels any RSVPs. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
