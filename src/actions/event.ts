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
  getUpcomingEvents,
  getEventsForMonth,
  getEventsForWeek,
  getEventInviteeMemberIds,
  inviteGroup,
  inviteMembers,
  setEventInvitees,
} from "@/services/event";
import type { EventType } from "@/generated/prisma/client";
import { getRecentActivity } from "@/services/dashboard";
import { getAllMessageHistory } from "@/services/message";
import { getAllMembers } from "@/lib/api/member-api";
import { coopNow } from "@/lib/time";
import { transformError } from "@/utils/errors";
import type { ActionResult } from "@/lib/action-types";
import type { EventWithRsvpCount, RsvpDetail, EventSummary } from "@/services/event";
import type { ActivityItem } from "@/services/dashboard";
import type { MessageHistoryItem } from "@/services/message";

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

export interface DashboardData {
  totalMembers: number;
  eventsThisMonth: number;
  upcomingEvents: EventSummary[];
  recentActivity: ActivityItem[];
  recentMessages: MessageHistoryItem[];
}

export async function fetchDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    await verifySession();

    const now = coopNow();
    const [memberList, monthEvents, upcomingEvents, recentActivity, recentMessages] = await Promise.all([
      getAllMembers(),
      getEventsForMonth(now.year, now.month0 + 1),
      getUpcomingEvents(4),
      getRecentActivity(3),
      getAllMessageHistory({ limit: 1 }),
    ]);

    return {
      success: true,
      data: {
        totalMembers: memberList.length,
        eventsThisMonth: monthEvents.length,
        upcomingEvents,
        recentActivity,
        recentMessages,
      },
    };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchEventsForWeek(weekStart: Date): Promise<ActionResult<EventSummary[]>> {
  try {
    await verifySession();
    const validatedWeekStart = WeekStartSchema.parse(weekStart);
    const events = await getEventsForWeek(validatedWeekStart);
    return { success: true, data: events };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchEventsForMonth(
  year: number,
  month: number,
  filters?: { eventType?: EventType; groupId?: number },
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
