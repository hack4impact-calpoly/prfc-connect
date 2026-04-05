"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { CreateEventSchema, UpdateEventSchema, RsvpSchema } from "@/schema/event";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  isEventOwner,
  rsvpToEvent,
  getEventRsvps,
  getUpcomingEvents,
} from "@/services/event";
import { getRecentActivity } from "@/services/dashboard";
import { getAllMessageHistory } from "@/services/message";
import { getAllMembers } from "@/lib/api/member-api";
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
  rsvpDeadline?: string | Date | null;
  eventType: string;
  groupId?: number | null;
}): Promise<ActionResult<{ id: number }>> {
  try {
    const session = await verifySession();
    const validated = CreateEventSchema.parse(input);
    const event = await createEvent(validated, session.ownerid);

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

    if (!session.isAdmin && !(await isEventOwner(eventId, session.ownerid))) {
      return { success: false, error: "You do not have permission to edit this event" };
    }

    const validated = UpdateEventSchema.parse(input);
    await updateEvent(eventId, validated);

    revalidatePath(`/events`);
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

    if (!session.isAdmin && !(await isEventOwner(eventId, session.ownerid))) {
      return { success: false, error: "You do not have permission to delete this event" };
    }

    await deleteEvent(eventId);

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

export async function fetchEventDetail(
  eventId: number,
): Promise<ActionResult<{ event: EventWithRsvpCount; rsvps: RsvpDetail[] }>> {
  try {
    await verifySession();
    const event = await getEventById(eventId);
    const rsvps = await getEventRsvps(eventId);
    return { success: true, data: { event, rsvps } };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export interface DashboardData {
  totalMembers: number;
  upcomingEvents: EventSummary[];
  recentActivity: ActivityItem[];
  recentMessages: MessageHistoryItem[];
}

export async function fetchDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    await verifySession();

    const [memberList, upcomingEvents, recentActivity, recentMessages] = await Promise.all([
      getAllMembers(),
      getUpcomingEvents(4),
      getRecentActivity(3),
      getAllMessageHistory({ limit: 1 }),
    ]);

    return {
      success: true,
      data: {
        totalMembers: memberList.length,
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
