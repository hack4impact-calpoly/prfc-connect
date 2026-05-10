import { mockPrisma } from "../mocks/prisma";
import { mockGetMemberDetails } from "../mocks/member-api";
import { mockGetGroupMembers } from "../mocks/contact-group-service";
import { eventMemberTownHall } from "../mocks/events";
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
  inviteMembers,
  inviteGroup,
  getEventInvitees,
  setEventInvitees,
} from "@/services/event";

const sampleEvent = eventMemberTownHall;

describe("createEvent", () => {
  it("creates event with owner", async () => {
    mockPrisma.event.create.mockResolvedValue(sampleEvent as never);

    const result = await createEvent(
      {
        title: "Member Town Hall",
        startDate: new Date(),
        endDate: new Date(),
        isAllDay: false,
        eventType: "meeting",
      },
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
      createEvent(
        { title: "Test", startDate: new Date(), endDate: new Date(), isAllDay: false, eventType: "social" },
        100001,
      ),
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
  it("queries timed events within coop-zone month boundaries and all-day events within UTC month boundaries", async () => {
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    await getEventsForMonth(2026, 4);

    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                {
                  isAllDay: false,
                  startDate: {
                    gte: new Date("2026-04-01T07:00:00.000Z"),
                    lte: new Date("2026-05-01T06:59:59.000Z"),
                  },
                },
                {
                  isAllDay: true,
                  startDate: {
                    gte: new Date("2026-04-01T00:00:00.000Z"),
                    lte: new Date("2026-04-30T23:59:59.999Z"),
                  },
                },
              ],
            },
          ],
        },
      }),
    );
  });

  it("merges eventType and groupId filters into the AND clause", async () => {
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    await getEventsForMonth(2026, 4, { eventType: "meeting", groupId: 5 });

    const call = mockPrisma.event.findMany.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(call.where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ OR: expect.any(Array) }),
        { eventType: "meeting" },
        { groupId: 5 },
      ]),
    );
  });
});

describe("getEventsForWeek", () => {
  it("queries timed events in coop-zone week and all-day events in UTC week", async () => {
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    await getEventsForWeek(new Date("2026-04-15T21:00:00.000Z"));

    const call = mockPrisma.event.findMany.mock.calls[0][0] as {
      where: { AND: Array<{ OR?: Array<{ isAllDay: boolean; startDate: { gte: Date; lte: Date } }> }> };
    };
    const dateFilter = call.where.AND[0].OR!;
    expect(dateFilter).toHaveLength(2);
    const timed = dateFilter.find((c) => c.isAllDay === false);
    const allDay = dateFilter.find((c) => c.isAllDay === true);
    expect(timed?.startDate.gte.toISOString()).toBe("2026-04-12T07:00:00.000Z");
    expect(timed?.startDate.lte.toISOString()).toBe("2026-04-19T06:59:59.999Z");
    expect(allDay?.startDate.gte.toISOString()).toBe("2026-04-12T00:00:00.000Z");
    expect(allDay?.startDate.lte.toISOString()).toBe("2026-04-18T23:59:59.999Z");
  });

  it("filters by inviteeMemberId when provided", async () => {
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    await getEventsForWeek(new Date("2026-04-15T21:00:00.000Z"), { inviteeMemberId: 100003 });

    const call = mockPrisma.event.findMany.mock.calls[0][0] as {
      where: { AND: unknown[] };
    };
    expect(call.where.AND).toHaveLength(2);
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

describe("inviteMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bulk creates invitee rows with skipDuplicates", async () => {
    mockPrisma.eventInvitee.createMany.mockResolvedValue({ count: 3 });

    await inviteMembers(1, [100001, 100002, 100003]);

    expect(mockPrisma.eventInvitee.createMany).toHaveBeenCalledWith({
      data: [
        { eventId: 1, memberId: 100001 },
        { eventId: 1, memberId: 100002 },
        { eventId: 1, memberId: 100003 },
      ],
      skipDuplicates: true,
    });
  });

  it("no-ops on empty memberIds", async () => {
    await inviteMembers(1, []);

    expect(mockPrisma.eventInvitee.createMany).not.toHaveBeenCalled();
  });
});

describe("inviteGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fans out group members into invitee rows", async () => {
    mockGetGroupMembers.mockResolvedValue([100001, 100002]);
    mockPrisma.eventInvitee.createMany.mockResolvedValue({ count: 2 });

    await inviteGroup(1, 5);

    expect(mockGetGroupMembers).toHaveBeenCalledWith(5);
    expect(mockPrisma.eventInvitee.createMany).toHaveBeenCalledWith({
      data: [
        { eventId: 1, memberId: 100001 },
        { eventId: 1, memberId: 100002 },
      ],
      skipDuplicates: true,
    });
  });
});

describe("getEventInvitees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invitees with resolved member names", async () => {
    mockPrisma.eventInvitee.findMany.mockResolvedValue([
      { memberId: 100001, createdAt: new Date("2026-04-05") },
    ] as never);
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 100001, ownername: "Kermit Komm", owneremail: "k@test.com", ownerphone: "805-555-0001" },
    ]);

    const result = await getEventInvitees(1);

    expect(result).toEqual([{ memberId: 100001, memberName: "Kermit Komm", createdAt: new Date("2026-04-05") }]);
  });

  it("falls back to Unknown Member when not resolved", async () => {
    mockPrisma.eventInvitee.findMany.mockResolvedValue([
      { memberId: 99999, createdAt: new Date("2026-04-05") },
    ] as never);
    mockGetMemberDetails.mockResolvedValue([]);

    const result = await getEventInvitees(1);

    expect(result[0].memberName).toBe("Unknown Member");
  });

  it("short-circuits without calling member API on empty result", async () => {
    mockPrisma.eventInvitee.findMany.mockResolvedValue([] as never);

    const result = await getEventInvitees(1);

    expect(result).toEqual([]);
    expect(mockGetMemberDetails).not.toHaveBeenCalled();
  });
});

describe("setEventInvitees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invites members present in desired but missing from current", async () => {
    mockPrisma.eventInvitee.findMany.mockResolvedValue([{ memberId: 100001 }, { memberId: 100002 }] as never);
    mockPrisma.eventInvitee.createMany.mockResolvedValue({ count: 1 } as never);
    mockPrisma.eventInvitee.deleteMany.mockResolvedValue({ count: 0 } as never);

    await setEventInvitees(1, [100001, 100002, 100003]);

    expect(mockPrisma.eventInvitee.createMany).toHaveBeenCalledWith({
      data: [{ eventId: 1, memberId: 100003 }],
      skipDuplicates: true,
    });
    expect(mockPrisma.eventInvitee.deleteMany).not.toHaveBeenCalled();
  });

  it("uninvites members in current but missing from desired", async () => {
    mockPrisma.eventInvitee.findMany.mockResolvedValue([
      { memberId: 100001 },
      { memberId: 100002 },
      { memberId: 100003 },
    ] as never);
    mockPrisma.eventInvitee.deleteMany.mockResolvedValue({ count: 2 } as never);

    await setEventInvitees(1, [100001]);

    expect(mockPrisma.eventInvitee.deleteMany).toHaveBeenCalledWith({
      where: { eventId: 1, memberId: { in: [100002, 100003] } },
    });
    expect(mockPrisma.eventInvitee.createMany).not.toHaveBeenCalled();
  });

  it("applies both additions and removals in a single call", async () => {
    mockPrisma.eventInvitee.findMany.mockResolvedValue([
      { memberId: 100001 },
      { memberId: 100002 },
      { memberId: 100003 },
    ] as never);
    mockPrisma.eventInvitee.createMany.mockResolvedValue({ count: 1 } as never);
    mockPrisma.eventInvitee.deleteMany.mockResolvedValue({ count: 2 } as never);

    await setEventInvitees(1, [100001, 100004]);

    expect(mockPrisma.eventInvitee.createMany).toHaveBeenCalledWith({
      data: [{ eventId: 1, memberId: 100004 }],
      skipDuplicates: true,
    });
    expect(mockPrisma.eventInvitee.deleteMany).toHaveBeenCalledWith({
      where: { eventId: 1, memberId: { in: [100002, 100003] } },
    });
  });

  it("is a no-op when desired matches current exactly", async () => {
    mockPrisma.eventInvitee.findMany.mockResolvedValue([{ memberId: 100001 }, { memberId: 100002 }] as never);

    await setEventInvitees(1, [100001, 100002]);

    expect(mockPrisma.eventInvitee.createMany).not.toHaveBeenCalled();
    expect(mockPrisma.eventInvitee.deleteMany).not.toHaveBeenCalled();
  });
});
