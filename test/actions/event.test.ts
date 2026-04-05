import "../mocks/next-cache";
import "../mocks/dal";

import { vi, type MockedFunction } from "vitest";
import { AppError } from "@/utils/errors";
import { mockVerifySession, mockRevalidatePath } from "../mocks";

vi.mock("@/services/event", () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  getEventById: vi.fn(),
  isEventOwner: vi.fn(),
  rsvpToEvent: vi.fn(),
  getEventRsvps: vi.fn(),
  getUpcomingEvents: vi.fn(),
}));

vi.mock("@/services/dashboard", () => ({
  getRecentActivity: vi.fn(),
}));

vi.mock("@/services/message", () => ({
  getAllMessageHistory: vi.fn(),
  sendGroupMessage: vi.fn(),
  sendBlastMessage: vi.fn(),
}));

vi.mock("@/lib/api/member-api", () => ({
  getAllMembers: vi.fn(),
}));

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
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
  rsvpAction,
  fetchEventDetail,
  fetchDashboardData,
} from "@/actions/event";

const mockCreateEvent = createEvent as MockedFunction<typeof createEvent>;
const mockUpdateEvent = updateEvent as MockedFunction<typeof updateEvent>;
const mockDeleteEvent = deleteEvent as MockedFunction<typeof deleteEvent>;
const mockGetEventById = getEventById as MockedFunction<typeof getEventById>;
const mockIsEventOwner = isEventOwner as MockedFunction<typeof isEventOwner>;
const mockRsvpToEvent = rsvpToEvent as MockedFunction<typeof rsvpToEvent>;
const mockGetEventRsvps = getEventRsvps as MockedFunction<typeof getEventRsvps>;
const mockGetUpcomingEvents = getUpcomingEvents as MockedFunction<typeof getUpcomingEvents>;
const mockGetRecentActivity = getRecentActivity as MockedFunction<typeof getRecentActivity>;
const mockGetAllMessageHistory = getAllMessageHistory as MockedFunction<typeof getAllMessageHistory>;
const mockGetAllMembers = getAllMembers as MockedFunction<typeof getAllMembers>;

const sampleEvent = {
  id: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  title: "Town Hall",
  description: null,
  location: null,
  startDate: new Date(),
  endDate: new Date(),
  rsvpDeadline: null,
  eventType: "meeting" as const,
  ownerid: 100001,
  groupId: null,
  rsvpCount: 5,
};

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

  it("returns event with RSVPs for any authenticated member", async () => {
    mockVerifySession.mockResolvedValue({ ownerid: 100003, isAdmin: false });
    mockGetEventById.mockResolvedValue(sampleEvent as never);
    mockGetEventRsvps.mockResolvedValue([]);

    const result = await fetchEventDetail(1);

    expect(result).toEqual({ success: true, data: { event: sampleEvent, rsvps: [] } });
  });
});

describe("fetchDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: true });
  });

  it("returns all dashboard sections", async () => {
    mockGetAllMembers.mockResolvedValue([
      { ownerid: 1, ownername: "A" },
      { ownerid: 2, ownername: "B" },
    ]);
    mockGetUpcomingEvents.mockResolvedValue([]);
    mockGetRecentActivity.mockResolvedValue([]);
    mockGetAllMessageHistory.mockResolvedValue([]);

    const result = await fetchDashboardData();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      totalMembers: 2,
      upcomingEvents: [],
      recentActivity: [],
      recentMessages: [],
    });
  });

  it("returns error when not authenticated", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await fetchDashboardData();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
  });
});
