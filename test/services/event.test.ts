import { vi, type MockedFunction } from "vitest";
import { mockPrisma } from "../mocks/prisma";

vi.mock("@/lib/api/member-api", () => ({
  getMemberDetails: vi.fn(),
}));

import { getMemberDetails } from "@/lib/api/member-api";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getUpcomingEvents,
  getEventsForMonth,
  getEventsForWeek,
  getEventsByGroup,
  isEventOwner,
  rsvpToEvent,
  getEventRsvps,
  getEventRsvpCounts,
} from "@/services/event";

const mockGetMemberDetails = getMemberDetails as MockedFunction<typeof getMemberDetails>;

const sampleEvent = {
  id: 1,
  createdAt: new Date("2026-04-01"),
  updatedAt: new Date("2026-04-01"),
  title: "Member Town Hall",
  description: "Monthly meeting",
  location: "Downtown Paso Robles",
  startDate: new Date("2026-04-08T18:00:00"),
  endDate: new Date("2026-04-08T19:00:00"),
  rsvpDeadline: new Date("2026-04-07T18:00:00"),
  eventType: "meeting" as const,
  ownerid: 100001,
  groupId: 1,
};

describe("createEvent", () => {
  it("creates event with owner", async () => {
    mockPrisma.event.create.mockResolvedValue(sampleEvent as never);

    const result = await createEvent(
      { title: "Member Town Hall", startDate: new Date(), endDate: new Date(), eventType: "meeting" },
      100001,
    );

    expect(result.id).toBe(1);
    expect(mockPrisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ownerid: 100001, title: "Member Town Hall" }),
    });
  });

  it("throws on database error", async () => {
    mockPrisma.event.create.mockRejectedValue(new Error("Connection lost"));

    await expect(
      createEvent({ title: "Test", startDate: new Date(), endDate: new Date(), eventType: "social" }, 100001),
    ).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("updateEvent", () => {
  it("updates event fields", async () => {
    mockPrisma.event.update.mockResolvedValue({ ...sampleEvent, title: "Updated" } as never);

    const result = await updateEvent(1, { title: "Updated" });

    expect(result.title).toBe("Updated");
  });
});

describe("deleteEvent", () => {
  it("deletes event", async () => {
    mockPrisma.event.delete.mockResolvedValue(sampleEvent as never);

    await expect(deleteEvent(1)).resolves.toBeUndefined();
    expect(mockPrisma.event.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});

describe("getEventById", () => {
  it("returns event with RSVP count", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({ ...sampleEvent, _count: { rsvps: 15 } } as never);

    const result = await getEventById(1);

    expect(result.rsvpCount).toBe(15);
    expect(result.title).toBe("Member Town Hall");
  });

  it("throws NOT_FOUND when event does not exist", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null);

    await expect(getEventById(999)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("getUpcomingEvents", () => {
  it("queries events with future startDate", async () => {
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    await getUpcomingEvents(4);

    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { startDate: { gte: expect.any(Date) } },
        orderBy: { startDate: "asc" },
        take: 4,
      }),
    );
  });
});

describe("getEventsForMonth", () => {
  it("queries events within month boundaries", async () => {
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    await getEventsForMonth(2026, 4);

    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          startDate: {
            gte: new Date(2026, 3, 1),
            lte: expect.any(Date),
          },
        },
      }),
    );
  });
});

describe("getEventsForWeek", () => {
  it("queries events within week boundaries", async () => {
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    await getEventsForWeek(new Date("2026-04-06"));

    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          startDate: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
      }),
    );
  });
});

describe("getEventsByGroup", () => {
  it("filters by groupId", async () => {
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    await getEventsByGroup(1);

    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { groupId: 1 } }));
  });
});

describe("isEventOwner", () => {
  it("returns true when event exists for owner", async () => {
    mockPrisma.event.findFirst.mockResolvedValue({ id: 1 } as never);

    const result = await isEventOwner(1, 100001);

    expect(result).toBe(true);
  });

  it("returns false when event does not exist for owner", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(null);

    const result = await isEventOwner(1, 100099);

    expect(result).toBe(false);
  });
});

describe("rsvpToEvent", () => {
  it("upserts RSVP for member", async () => {
    mockPrisma.eventRsvp.upsert.mockResolvedValue({} as never);

    await rsvpToEvent(1, 100001, "going");

    expect(mockPrisma.eventRsvp.upsert).toHaveBeenCalledWith({
      where: { eventId_memberId: { eventId: 1, memberId: 100001 } },
      create: { eventId: 1, memberId: 100001, status: "going" },
      update: { status: "going", respondedAt: expect.any(Date) },
    });
  });
});

describe("getEventRsvps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns RSVPs with member names", async () => {
    mockPrisma.eventRsvp.findMany.mockResolvedValue([
      { memberId: 100001, status: "going", respondedAt: new Date("2026-04-05") },
    ] as never);
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 100001, ownername: "Kermit Komm", owneremail: "k@test.com", ownerphone: "805-555-0001" },
    ]);

    const result = await getEventRsvps(1);

    expect(result).toEqual([
      { memberId: 100001, memberName: "Kermit Komm", status: "going", respondedAt: new Date("2026-04-05") },
    ]);
  });
});

describe("getEventRsvpCounts", () => {
  it("returns counts per status", async () => {
    mockPrisma.eventRsvp.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3).mockResolvedValueOnce(2);

    const result = await getEventRsvpCounts(1);

    expect(result).toEqual({ going: 10, maybe: 3, declined: 2 });
  });
});
