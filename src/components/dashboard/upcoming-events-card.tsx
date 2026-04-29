import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { coopFormatTimed } from "@/utils/time";
import type { EventType } from "@/generated/prisma/client";

interface UpcomingEventsCardProps {
  events: Array<{
    id: number;
    title: string;
    startDate: Date;
    eventType: EventType;
    groupName: string | null;
    rsvpCount: number;
  }>;
}

const EVENT_EMOJI: Record<EventType, string> = {
  social: "\u{1F354}",
  networking: "\u{1F3DB}\u{FE0F}",
  volunteer: "\u{1F308}",
  meeting: "\u{2B50}",
};

const EVENT_BG: Record<EventType, string> = {
  social: "bg-amber-100",
  networking: "bg-blue-100",
  volunteer: "bg-green-100",
  meeting: "bg-yellow-100",
};

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col pt-6">
        <h2 className="font-angkor text-xl">Upcoming Events</h2>
        <div className="mt-4 flex-1 space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events. Create one to engage members.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-lg bg-paso-grey px-4 py-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${EVENT_BG[event.eventType]}`}
                >
                  <span className="text-lg">{EVENT_EMOJI[event.eventType]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  {event.groupName && <p className="truncate text-xs text-muted-foreground">{event.groupName}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm">
                    {coopFormatTimed(event.startDate, "MMM d")} &middot; {coopFormatTimed(event.startDate, "h:mm a")}
                  </p>
                  <p className="text-xs text-muted-foreground">RSVPs: {event.rsvpCount}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <hr className="mt-3 border-prfc-border/30" />
        <Link
          href="/events"
          className="mt-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
