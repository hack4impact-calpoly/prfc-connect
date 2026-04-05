import "server-only";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { AppError, transformError } from "@/utils/errors";
import { getMemberDetails } from "@/lib/api/member-api";
import type { CreateEvent, UpdateEvent } from "@/schema/event";
import type { Event, EventType, RsvpStatus } from "@/generated/prisma/client";

export interface EventWithRsvpCount extends Event {
  rsvpCount: number;
}

export interface EventSummary {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
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

export async function createEvent(data: CreateEvent, ownerid: number): Promise<Event> {
  try {
    return await prisma.event.create({
      data: { ...data, ownerid },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function updateEvent(id: number, data: UpdateEvent): Promise<Event> {
  try {
    return await prisma.event.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function deleteEvent(id: number): Promise<void> {
  try {
    await prisma.event.delete({ where: { id } });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventById(id: number): Promise<EventWithRsvpCount> {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { rsvps: true } } },
    });

    if (!event) {
      throw new AppError("NOT_FOUND", "Event not found");
    }

    return { ...event, rsvpCount: event._count.rsvps };
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventsByOwner(ownerid: number): Promise<EventSummary[]> {
  try {
    return await queryEventSummaries({ ownerid });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getAllEvents(): Promise<EventSummary[]> {
  try {
    return await queryEventSummaries({});
  } catch (error) {
    throw transformError(error);
  }
}

export async function getUpcomingEvents(limit: number = 5): Promise<EventSummary[]> {
  try {
    return await queryEventSummaries({ startDate: { gte: new Date() } }, { startDate: "asc" }, limit);
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventsForMonth(year: number, month: number): Promise<EventSummary[]> {
  try {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(start);

    return await queryEventSummaries({
      startDate: { gte: start, lte: end },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventsForWeek(weekStart: Date): Promise<EventSummary[]> {
  try {
    const start = startOfWeek(weekStart);
    const end = endOfWeek(start);

    return await queryEventSummaries({
      startDate: { gte: start, lte: end },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventsByGroup(groupId: number): Promise<EventSummary[]> {
  try {
    return await queryEventSummaries({ groupId });
  } catch (error) {
    throw transformError(error);
  }
}

export async function isEventOwner(eventId: number, ownerid: number): Promise<boolean> {
  try {
    const event = await prisma.event.findFirst({
      where: { id: eventId, ownerid },
      select: { id: true },
    });
    return event !== null;
  } catch (error) {
    throw transformError(error);
  }
}

export async function rsvpToEvent(eventId: number, memberId: number, status: RsvpStatus): Promise<void> {
  try {
    await prisma.eventRsvp.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      create: { eventId, memberId, status },
      update: { status, respondedAt: new Date() },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventRsvps(eventId: number): Promise<RsvpDetail[]> {
  try {
    const rsvps = await prisma.eventRsvp.findMany({
      where: { eventId },
      select: { memberId: true, status: true, respondedAt: true },
      orderBy: { respondedAt: "desc" },
    });

    const memberIds = rsvps.map((r) => r.memberId);
    const members = await getMemberDetails(memberIds);
    const memberMap = new Map(members.map((m) => [m.ownerid, m.ownername]));

    return rsvps.map((r) => ({
      memberId: r.memberId,
      memberName: memberMap.get(r.memberId) ?? "Unknown Member",
      status: r.status,
      respondedAt: r.respondedAt,
    }));
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventRsvpCounts(eventId: number): Promise<RsvpCounts> {
  try {
    const [going, maybe, declined] = await Promise.all([
      prisma.eventRsvp.count({ where: { eventId, status: "going" } }),
      prisma.eventRsvp.count({ where: { eventId, status: "maybe" } }),
      prisma.eventRsvp.count({ where: { eventId, status: "declined" } }),
    ]);

    return { going, maybe, declined };
  } catch (error) {
    throw transformError(error);
  }
}

async function queryEventSummaries(
  where: Record<string, unknown>,
  orderBy: Record<string, string> = { startDate: "desc" },
  take?: number,
): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where,
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      eventType: true,
      location: true,
      group: { select: { name: true } },
      _count: { select: { rsvps: true } },
    },
    orderBy,
    ...(take ? { take } : {}),
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    eventType: e.eventType,
    location: e.location,
    groupName: e.group?.name ?? null,
    rsvpCount: e._count.rsvps,
  }));
}
