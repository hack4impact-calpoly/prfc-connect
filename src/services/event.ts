import "server-only";
import prisma from "@/lib/db";
import { AppError, transformError } from "@/utils/errors";
import { getMemberDetails } from "@/lib/api/member-api";
import { getGroupMembers } from "@/services/contact-group";
import {
  coopEndOfMonth,
  coopEndOfWeek,
  coopStartOfMonth,
  coopStartOfWeek,
  utcEndOfMonth,
  utcEndOfWeek,
  utcStartOfMonth,
  utcStartOfWeek,
} from "@/utils/time";
import type { CreateEvent, UpdateEvent } from "@/schema/event";
import type { Event, EventType, RsvpStatus } from "@/generated/prisma/client";
import type { EventWithRsvpCount, EventSummary, RsvpDetail, RsvpCounts, InviteeDetail } from "@/types/event";
export type { EventWithRsvpCount, EventSummary, RsvpDetail, RsvpCounts, InviteeDetail } from "@/types/event";

export async function createEvent(data: Omit<CreateEvent, "memberIds" | "groupIds">, ownerid: number): Promise<Event> {
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

export async function getEventsForMonth(
  year: number,
  month: number,
  filters?: { eventType?: EventType; groupId?: number; inviteeMemberId?: number },
): Promise<EventSummary[]> {
  try {
    const coopStart = coopStartOfMonth(year, month);
    const coopEnd = coopEndOfMonth(year, month);
    const floatingStart = utcStartOfMonth(year, month);
    const floatingEnd = utcEndOfMonth(year, month);

    return await queryEventSummaries({
      AND: [
        {
          OR: [
            { isAllDay: false, startDate: { gte: coopStart, lte: coopEnd } },
            { isAllDay: true, startDate: { gte: floatingStart, lte: floatingEnd } },
          ],
        },
        ...(filters?.eventType ? [{ eventType: filters.eventType }] : []),
        ...(filters?.groupId ? [{ groupId: filters.groupId }] : []),
        ...(filters?.inviteeMemberId
          ? [
              {
                OR: [
                  { invitees: { some: { memberId: filters.inviteeMemberId } } },
                  { ownerid: filters.inviteeMemberId },
                ],
              },
            ]
          : []),
      ],
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventsForWeek(
  weekStart: Date,
  filters?: { inviteeMemberId?: number },
): Promise<EventSummary[]> {
  try {
    const coopStart = coopStartOfWeek(weekStart);
    const coopEnd = coopEndOfWeek(weekStart);
    const floatingStart = utcStartOfWeek(weekStart);
    const floatingEnd = utcEndOfWeek(weekStart);

    return await queryEventSummaries({
      AND: [
        {
          OR: [
            { isAllDay: false, startDate: { gte: coopStart, lte: coopEnd } },
            { isAllDay: true, startDate: { gte: floatingStart, lte: floatingEnd } },
          ],
        },
        ...(filters?.inviteeMemberId
          ? [
              {
                OR: [
                  { invitees: { some: { memberId: filters.inviteeMemberId } } },
                  { ownerid: filters.inviteeMemberId },
                ],
              },
            ]
          : []),
      ],
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

export async function inviteMembers(eventId: number, memberIds: number[]): Promise<void> {
  if (memberIds.length === 0) return;
  try {
    await prisma.eventInvitee.createMany({
      data: memberIds.map((memberId) => ({ eventId, memberId })),
      skipDuplicates: true,
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function inviteGroup(eventId: number, groupId: number): Promise<void> {
  try {
    const memberIds = await getGroupMembers(groupId);
    await inviteMembers(eventId, memberIds);
  } catch (error) {
    throw transformError(error);
  }
}

export async function uninviteMembers(eventId: number, memberIds: number[]): Promise<void> {
  if (memberIds.length === 0) return;
  try {
    await prisma.eventInvitee.deleteMany({
      where: { eventId, memberId: { in: memberIds } },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function setEventInvitees(eventId: number, memberIds: number[]): Promise<void> {
  try {
    const currentIds = await getEventInviteeMemberIds(eventId);
    const currentSet = new Set(currentIds);
    const desiredSet = new Set(memberIds);
    const toAdd = memberIds.filter((id) => !currentSet.has(id));
    const toRemove = currentIds.filter((id) => !desiredSet.has(id));
    if (toAdd.length > 0) await inviteMembers(eventId, toAdd);
    if (toRemove.length > 0) await uninviteMembers(eventId, toRemove);
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventInviteeMemberIds(eventId: number): Promise<number[]> {
  try {
    const rows = await prisma.eventInvitee.findMany({
      where: { eventId },
      select: { memberId: true },
    });
    return rows.map((r) => r.memberId);
  } catch (error) {
    throw transformError(error);
  }
}

export async function getEventInvitees(eventId: number): Promise<InviteeDetail[]> {
  try {
    const rows = await prisma.eventInvitee.findMany({
      where: { eventId },
      select: { memberId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    if (rows.length === 0) return [];

    const memberIds = rows.map((r) => r.memberId);
    const members = await getMemberDetails(memberIds);
    const memberMap = new Map(members.map((m) => [m.ownerid, m.ownername]));

    return rows.map((r) => ({
      memberId: r.memberId,
      memberName: memberMap.get(r.memberId) ?? "Unknown Member",
      createdAt: r.createdAt,
    }));
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
      isAllDay: true,
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
    isAllDay: e.isAllDay,
    eventType: e.eventType,
    location: e.location,
    groupName: e.group?.name ?? null,
    rsvpCount: e._count.rsvps,
  }));
}
