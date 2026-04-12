"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Clock, MapPin, CalendarCheck, List, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InviteeCombobox, type GroupOption, type MemberOption } from "@/components/events/invitee-combobox";
import { createEventAction } from "@/actions/event";
import { cn } from "@/lib/utils";
import type { EventType } from "@/generated/prisma/client";

type Props = {
  onClose: () => void;
  defaultDate?: Date;
  groups: GroupOption[];
  members: MemberOption[];
  onSaved?: (eventId: number) => void;
};

const EVENT_TYPES: { value: EventType; label: string; dot: string }[] = [
  { value: "social", label: "Social", dot: "bg-prfc-brown" },
  { value: "networking", label: "Networking", dot: "bg-amber-600" },
  { value: "meeting", label: "Meeting", dot: "bg-prfc-red" },
  { value: "volunteer", label: "Volunteer", dot: "bg-green-700" },
];

function defaultEndFor(start: Date): Date {
  return new Date(start.getTime() + 60 * 60 * 1000);
}

export function CreateEventPopover({ onClose, defaultDate, groups, members, onSaved }: Props) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("social");
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({
    start: defaultDate ?? null,
    end: defaultDate ? defaultEndFor(defaultDate) : null,
  });
  const [location, setLocation] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState<Date | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const toggleGroup = (id: number) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    if (range.end <= range.start) {
      setError("End time must be after start time");
      return;
    }

    startTransition(async () => {
      const result = await createEventAction({
        title: title.trim(),
        eventType,
        startDate: range.start!,
        endDate: range.end!,
        location: location.trim() || null,
        description: description.trim() || null,
        rsvpDeadline: rsvpDeadline,
        groupIds: Array.from(selectedGroupIds),
        memberIds: Array.from(selectedMemberIds),
      });
      if (result.success) {
        toast.success("Event created");
        onSaved?.(result.data!.id);
        onClose();
      } else {
        const message = result.error ?? "Failed to create event";
        toast.error(message);
        setError(message);
      }
    });
  };

  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden bg-white">
      <DialogTitle className="sr-only">Create event</DialogTitle>
      <DialogDescription className="sr-only">
        Fill in the event details and click Save to create a new event.
      </DialogDescription>
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New Event Title"
          maxLength={200}
          className="w-full border-none bg-transparent font-angkor text-3xl text-prfc-red outline-none placeholder:text-foreground"
          aria-label="Event title"
        />

        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((type) => {
            const isSelected = eventType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setEventType(type.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                  isSelected
                    ? "border-prfc-brown bg-paso-light-brown text-prfc-brown"
                    : "border-prfc-border/40 text-muted-foreground hover:bg-paso-grey",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", type.dot)} />
                {type.label}
              </button>
            );
          })}
        </div>

        <DateTimePicker mode="range" label="Date and time" icon={Clock} value={range} onChange={setRange} />

        <div className="flex items-center gap-3 rounded-lg border border-prfc-border/30 bg-paso-grey px-4 py-3">
          <MapPin className="h-5 w-5 shrink-0 text-prfc-brown" />
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add Location"
            maxLength={200}
            className="border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <DateTimePicker
          mode="single"
          label="RSVP Deadline"
          icon={CalendarCheck}
          value={rsvpDeadline}
          onChange={setRsvpDeadline}
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
            className="min-h-[80px] border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-prfc-border/30 bg-white px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-prfc-brown text-white hover:bg-prfc-dark-brown"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
