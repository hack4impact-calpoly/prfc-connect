import "../mocks/next-cache";
import "../mocks/dal";
import "../mocks/event-service";

import { vi } from "vitest";
import { AppError } from "@/utils/errors";
import { mockVerifySession, mockRevalidatePath, eventTownHall } from "../mocks";
import {
  mockCreateEvent,
  mockUpdateEvent,
  mockDeleteEvent,
  mockGetEventById,
  mockIsEventOwner,
  mockRsvpToEvent,
  mockGetEventRsvps,
  mockGetEventsForMonth,
  mockGetEventsForWeek,
  mockGetEventInviteeMemberIds,
  mockInviteGroup,
  mockInviteMembers,
  mockSetEventInvitees,
} from "../mocks/event-service";

import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  rsvpAction,
  fetchEventDetail,
  fetchEventsForWeek,
  fetchEventsForMonth,
} from "@/actions/event";

const sampleEvent = eventTownHall;

describe("createEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("creates event and revalidates paths", async () => {
    mockCreateEvent.mockResolvedValue({ ...sampleEvent } as never);

    const result = await createEventAction({
      title: "Town Hall",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      eventType: "meeting",
    });

    expect(result).toEqual({ success: true, data: { id: 1 } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/events");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/home");
  });

  it("rejects invalid event type", async () => {
    const result = await createEventAction({
      title: "Test",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      eventType: "invalid",
    });

    expect(result.success).toBe(false);
  });

  it("fans out memberIds and groupIds after creating the event, stripping invitee fields from the create call", async () => {
    mockCreateEvent.mockResolvedValue({ ...sampleEvent } as never);
    mockInviteGroup.mockResolvedValue(undefined);
    mockInviteMembers.mockResolvedValue(undefined);

    const result = await createEventAction({
      title: "Town Hall",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      eventType: "meeting",
      memberIds: [100002, 100003],
      groupIds: [5, 6],
    });

    expect(result.success).toBe(true);
    expect(mockInviteGroup).toHaveBeenCalledWith(1, 5);
    expect(mockInviteGroup).toHaveBeenCalledWith(1, 6);
    expect(mockInviteMembers).toHaveBeenCalledWith(1, [100002, 100003]);

    const createCallArg = mockCreateEvent.mock.calls[0][0];
    expect(createCallArg).not.toHaveProperty("memberIds");
    expect(createCallArg).not.toHaveProperty("groupIds");
  });

  it("skips invitee fan-out when memberIds and groupIds are absent", async () => {
    mockCreateEvent.mockResolvedValue({ ...sampleEvent } as never);

    await createEventAction({
      title: "Solo",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      eventType: "social",
    });

    expect(mockInviteGroup).not.toHaveBeenCalled();
    expect(mockInviteMembers).not.toHaveBeenCalled();
  });
});

describe("updateEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner to update event", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
    mockIsEventOwner.mockResolvedValue(true);
    mockUpdateEvent.mockResolvedValue(sampleEvent as never);

    const result = await updateEventAction(1, { title: "Updated" });

    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/events");
  });

  it("rejects non-owner non-admin updates", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100003, isAdmin: false });
    mockIsEventOwner.mockResolvedValue(false);

    const result = await updateEventAction(1, { title: "Blocked" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("do not have permission");
  });

  it("delegates invitee changes to setEventInvitees when memberIds is provided", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: true });
    mockIsEventOwner.mockResolvedValue(true);
    mockUpdateEvent.mockResolvedValue(sampleEvent as never);
    mockSetEventInvitees.mockResolvedValue(undefined);

    const result = await updateEventAction(1, {
      title: "Updated",
      memberIds: [100001, 100004],
    });

    expect(result.success).toBe(true);
    expect(mockSetEventInvitees).toHaveBeenCalledWith(1, [100001, 100004]);
  });

  it("does not call setEventInvitees when memberIds is not provided", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: true });
    mockIsEventOwner.mockResolvedValue(true);
    mockUpdateEvent.mockResolvedValue(sampleEvent as never);

    await updateEventAction(1, { title: "Title only" });

    expect(mockSetEventInvitees).not.toHaveBeenCalled();
  });
});

describe("deleteEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner to delete event", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
    mockIsEventOwner.mockResolvedValue(true);
    mockDeleteEvent.mockResolvedValue(undefined);

    const result = await deleteEventAction(1);

    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/events");
  });

  it("rejects non-owner non-admin deletes", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100003, isAdmin: false });
    mockIsEventOwner.mockResolvedValue(false);

    const result = await deleteEventAction(1);

    expect(result.success).toBe(false);
  });
});

describe("rsvpAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("submits RSVP and revalidates", async () => {
    mockRsvpToEvent.mockResolvedValue(undefined);

    const result = await rsvpAction({ eventId: 1, status: "going" });

    expect(result.success).toBe(true);
    expect(mockRsvpToEvent).toHaveBeenCalledWith(1, 100001, "going");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/events");
  });

  it("rejects invalid status", async () => {
    const result = await rsvpAction({ eventId: 1, status: "invalid" });

    expect(result.success).toBe(false);
  });
});

describe("fetchEventDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns event with RSVPs and invitee member IDs for any authenticated member", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100003, isAdmin: false });
    mockGetEventById.mockResolvedValue(sampleEvent as never);
    mockGetEventRsvps.mockResolvedValue([]);
    mockGetEventInviteeMemberIds.mockResolvedValue([100001, 100002]);

    const result = await fetchEventDetail(1);

    expect(result).toEqual({
      success: true,
      data: { event: sampleEvent, rsvps: [], inviteeMemberIds: [100001, 100002] },
    });
  });
});

describe("fetchEventsForWeek", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("returns events for the given week start", async () => {
    const events = [{ id: 1, title: "Board Meeting" }] as never;
    mockGetEventsForWeek.mockResolvedValue(events);

    const weekStart = new Date("2026-04-12");
    const result = await fetchEventsForWeek(weekStart);

    expect(result).toEqual({ success: true, data: events });
    expect(mockGetEventsForWeek).toHaveBeenCalledWith(weekStart);
  });

  it("returns error when service throws", async () => {
    mockGetEventsForWeek.mockRejectedValue(new Error("DB failure"));

    const result = await fetchEventsForWeek(new Date("2026-04-12"));

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await fetchEventsForWeek(new Date("2026-04-12"));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
    expect(mockGetEventsForWeek).not.toHaveBeenCalled();
  });

  it("rejects a non-date weekStart argument", async () => {
    const result = await fetchEventsForWeek("not-a-date" as unknown as Date);

    expect(result.success).toBe(false);
    expect(mockGetEventsForWeek).not.toHaveBeenCalled();
  });
});

describe("fetchEventsForMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("returns events for the given year and month without filters", async () => {
    const events = [{ id: 1, title: "Co-op Meeting" }] as never;
    mockGetEventsForMonth.mockResolvedValue(events);

    const result = await fetchEventsForMonth(2026, 4);

    expect(result).toEqual({ success: true, data: events });
    expect(mockGetEventsForMonth).toHaveBeenCalledWith(2026, 4, undefined);
  });

  it("forwards filters to the service", async () => {
    mockGetEventsForMonth.mockResolvedValue([]);

    await fetchEventsForMonth(2026, 4, { eventType: "meeting", groupId: 7 });

    expect(mockGetEventsForMonth).toHaveBeenCalledWith(2026, 4, {
      eventType: "meeting",
      groupId: 7,
    });
  });

  it("returns error when service throws", async () => {
    mockGetEventsForMonth.mockRejectedValue(new Error("DB failure"));

    const result = await fetchEventsForMonth(2026, 4);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error when not authenticated", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await fetchEventsForMonth(2026, 4);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
    expect(mockGetEventsForMonth).not.toHaveBeenCalled();
  });

  it("rejects a month outside 1-12", async () => {
    const result = await fetchEventsForMonth(2026, 13);

    expect(result.success).toBe(false);
    expect(mockGetEventsForMonth).not.toHaveBeenCalled();
  });

  it("rejects a non-positive year", async () => {
    const result = await fetchEventsForMonth(0, 4);

    expect(result.success).toBe(false);
    expect(mockGetEventsForMonth).not.toHaveBeenCalled();
  });
});

describe("deleteEventAction input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: true });
  });

  it("rejects a non-positive eventId", async () => {
    const result = await deleteEventAction(0);

    expect(result.success).toBe(false);
    expect(mockDeleteEvent).not.toHaveBeenCalled();
  });
});

describe("fetchEventDetail input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("rejects a non-positive eventId", async () => {
    const result = await fetchEventDetail(-5);

    expect(result.success).toBe(false);
    expect(mockGetEventById).not.toHaveBeenCalled();
  });
});
