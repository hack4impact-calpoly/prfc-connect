import type { Event, EventType, RsvpStatus } from "@/generated/prisma/client";

export interface EventWithRsvpCount extends Event {
  rsvpCount: number;
}

export interface EventSummary {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  eventType: EventType;
  location: string | null;
  groupName: string | null;
  rsvpCount: number;
}

export interface RsvpDetail {
  memberId: number;
  memberName: string;
  status: RsvpStatus;
  respondedAt: Date;
}

export interface RsvpCounts {
  going: number;
  maybe: number;
  declined: number;
}

export interface InviteeDetail {
  memberId: number;
  memberName: string;
  createdAt: Date;
}
