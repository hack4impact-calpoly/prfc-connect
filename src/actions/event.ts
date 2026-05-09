"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  CreateEventSchema,
  UpdateEventSchema,
  RsvpSchema,
  EventIdSchema,
  WeekStartSchema,
  FetchEventsForMonthSchema,
} from "@/schema/event";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  isEventOwner,
  rsvpToEvent,
  getEventRsvps,
  getEventsForMonth,
  getEventsForWeek,
  getEventInviteeMemberIds,
  inviteGroup,
  inviteMembers,
  setEventInvitees,
} from "@/services/event";
import type { EventType } from "@/generated/prisma/client";
import { transformError } from "@/utils/errors";
import type { ActionResult } from "@/types/action";
import type { EventWithRsvpCount, RsvpDetail, EventSummary } from "@/types/event";

export async function createEventAction(input: {
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  isAllDay?: boolean;
  rsvpDeadline?: string | Date | null;
  eventType: string;
  groupId?: number | null;
  memberIds?: number[];
  groupIds?: number[];
}): Promise<ActionResult<{ id: number }>> {
  try {
    const session = await verifySession();
    const validated = CreateEventSchema.parse(input);

    const { memberIds, groupIds, ...eventData } = validated;
    const event = await createEvent(eventData, session.ownerid);

    if (groupIds && groupIds.length > 0) {
      await Promise.all(groupIds.map((gid) => inviteGroup(event.id, gid)));
    }
    if (memberIds && memberIds.length > 0) {
      await inviteMembers(event.id, memberIds);
    }

    revalidatePath("/events");
    revalidatePath("/home");
    return { success: true, data: { id: event.id } };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function updateEventAction(eventId: number, input: Record<string, unknown>): Promise<ActionResult> {
  try {
    const session = await verifySession();
    const validatedId = EventIdSchema.parse(eventId);

    if (!session.isAdmin && !(await isEventOwner(validatedId, session.ownerid))) {
      return { success: false, error: "You do not have permission to edit this event" };
    }

    const validated = UpdateEventSchema.parse(input);
    const { memberIds, groupIds, ...eventData } = validated;
    await updateEvent(validatedId, eventData);

    if (memberIds !== undefined) {
      await setEventInvitees(validatedId, memberIds);
    }

    if (groupIds && groupIds.length > 0) {
      await Promise.all(groupIds.map((gid) => inviteGroup(validatedId, gid)));
    }

    revalidatePath("/events");
    revalidatePath("/home");
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function deleteEventAction(eventId: number): Promise<ActionResult> {
  try {
    const session = await verifySession();
    const validatedId = EventIdSchema.parse(eventId);

    if (!session.isAdmin && !(await isEventOwner(validatedId, session.ownerid))) {
      return { success: false, error: "You do not have permission to delete this event" };
    }

    await deleteEvent(validatedId);

    revalidatePath("/events");
    revalidatePath("/home");
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function rsvpAction(input: { eventId: number; status: string }): Promise<ActionResult> {
  try {
    const session = await verifySession();
    const validated = RsvpSchema.parse(input);

    const event = await getEventById(validated.eventId);

    if (event.rsvpDeadline && event.rsvpDeadline.getTime() < Date.now()) {
      return { success: false, error: "RSVP deadline has passed" };
    }

    const inviteeIds = await getEventInviteeMemberIds(validated.eventId);
    if (!inviteeIds.includes(session.ownerid) && event.ownerid !== session.ownerid) {
      return { success: false, error: "You are not invited to this event" };
    }

    await rsvpToEvent(validated.eventId, session.ownerid, validated.status);

    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchEventDetail(eventId: number): Promise<
  ActionResult<{
    event: EventWithRsvpCount;
    rsvps: RsvpDetail[];
    inviteeMemberIds: number[];
  }>
> {
  try {
    await verifySession();
    const validatedId = EventIdSchema.parse(eventId);
    const event = await getEventById(validatedId);
    const rsvps = await getEventRsvps(validatedId);
    const inviteeMemberIds = await getEventInviteeMemberIds(validatedId);
    return { success: true, data: { event, rsvps, inviteeMemberIds } };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchEventsForWeek(
  weekStart: Date,
  filters?: { inviteeMemberId?: number },
): Promise<ActionResult<EventSummary[]>> {
  try {
    await verifySession();
    const validatedWeekStart = WeekStartSchema.parse(weekStart);
    const events = await getEventsForWeek(validatedWeekStart, filters);
    return { success: true, data: events };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchEventsForMonth(
  year: number,
  month: number,
  filters?: { eventType?: EventType; groupId?: number; inviteeMemberId?: number },
): Promise<ActionResult<EventSummary[]>> {
  try {
    await verifySession();
    const validated = FetchEventsForMonthSchema.parse({ year, month, filters });
    const events = await getEventsForMonth(validated.year, validated.month, validated.filters);
    return { success: true, data: events };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}
