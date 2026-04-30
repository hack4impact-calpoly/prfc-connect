import { vi, type MockedFunction } from "vitest";
import { mockPrisma } from "../mocks/prisma";

vi.mock("@/services/contact-group", () => ({
  getGroupRecipients: vi.fn(),
}));

vi.mock("@/services/email", () => ({
  sendGroupEmails: vi.fn(),
}));

vi.mock("@/lib/api/member-api", () => ({
  getMemberDetails: vi.fn(),
  getAllActiveMemberIds: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: { SMS_ENABLED: false, FROM_EMAIL: "no-reply@prfc.coop" },
}));

import { getMemberDetails } from "@/lib/api/member-api";
import {
  getAllMessageHistory,
  getMessageHistoryPage,
  getMessageById,
  getMessageRecipients,
  previewRecipientCounts,
} from "@/services/message";

const mockGetMemberDetails = getMemberDetails as MockedFunction<typeof getMemberDetails>;

describe("getAllMessageHistory", () => {
  it("returns messages with group names", async () => {
    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 1,
        subject: "Hello",
        body: "Hello body",
        sentAt: new Date("2026-04-01"),
        emailCount: 5,
        smsCount: 0,
        failedCount: 0,
        isBlast: false,
        groups: [{ group: { name: "Garden Club" } }],
      },
    ] as never);

    const result = await getAllMessageHistory({});

    expect(result).toEqual([
      {
        id: 1,
        subject: "Hello",
        body: "Hello body",
        sentAt: new Date("2026-04-01"),
        emailCount: 5,
        smsCount: 0,
        failedCount: 0,
        isBlast: false,
        groupNames: ["Garden Club"],
      },
    ]);
  });

  it("returns empty groupNames for blast messages", async () => {
    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 2,
        subject: "Blast",
        body: "Blast body",
        sentAt: new Date("2026-04-01"),
        emailCount: 100,
        smsCount: 0,
        failedCount: 0,
        isBlast: true,
        groups: [],
      },
    ] as never);

    const result = await getAllMessageHistory({});

    expect(result[0].groupNames).toEqual([]);
    expect(result[0].isBlast).toBe(true);
  });

  it("filters by senderId when provided", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getAllMessageHistory({ senderId: 100001 });

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ senderId: 100001 }),
      }),
    );
  });

  it("filters by channel when provided", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getAllMessageHistory({ channel: "email" });

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ recipients: { some: { channel: "email" } } }),
      }),
    );
  });

  it("applies limit and offset", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getAllMessageHistory({ limit: 10, offset: 20 });

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10, skip: 20 }));
  });

  it("caps limit at 100", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getAllMessageHistory({ limit: 500 });

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });

  it("throws on database error", async () => {
    mockPrisma.message.findMany.mockRejectedValue(new Error("Connection lost"));

    await expect(getAllMessageHistory({})).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("getMessageById", () => {
  it("returns message with group names", async () => {
    mockPrisma.message.findUnique.mockResolvedValue({
      id: 1,
      subject: "Hello",
      body: "Body text",
      sentAt: new Date("2026-04-01"),
      senderId: 100001,
      emailCount: 5,
      smsCount: 0,
      failedCount: 0,
      isBlast: false,
      groups: [{ group: { name: "Garden Club" } }],
    } as never);

    const result = await getMessageById(1);

    expect(result).toHaveProperty("groupNames", ["Garden Club"]);
    expect(result).toHaveProperty("body", "Body text");
    expect(result).toHaveProperty("senderId", 100001);
  });

  it("throws NOT_FOUND when message does not exist", async () => {
    mockPrisma.message.findUnique.mockResolvedValue(null);

    await expect(getMessageById(999)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws on database error", async () => {
    mockPrisma.message.findUnique.mockRejectedValue(new Error("Connection lost"));

    await expect(getMessageById(1)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("getMessageRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recipients with member names and delivery status", async () => {
    mockPrisma.messageRecipient.findMany.mockResolvedValue([
      { memberId: 100001, channel: "email", status: "sent", sentAt: new Date("2026-04-01") },
      { memberId: 100003, channel: "email", status: "pending", sentAt: null },
    ] as never);
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 100001, ownername: "Kermit Komm", owneremail: "k@test.com", ownerphone: "805-555-0001" },
      { ownerid: 100003, ownername: "Angelica Allison", owneremail: "a@test.com", ownerphone: "805-555-0003" },
    ]);

    const result = await getMessageRecipients(1);

    expect(result).toEqual([
      { memberId: 100001, memberName: "Kermit Komm", channel: "email", status: "sent", sentAt: new Date("2026-04-01") },
      { memberId: 100003, memberName: "Angelica Allison", channel: "email", status: "pending", sentAt: null },
    ]);
  });

  it("deduplicates member IDs before fetching names", async () => {
    mockPrisma.messageRecipient.findMany.mockResolvedValue([
      { memberId: 100001, channel: "email", status: "sent", sentAt: new Date() },
      { memberId: 100001, channel: "sms", status: "sent", sentAt: new Date() },
    ] as never);
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 100001, ownername: "Kermit Komm", owneremail: "k@test.com", ownerphone: "805-555-0001" },
    ]);

    await getMessageRecipients(1);

    expect(mockGetMemberDetails).toHaveBeenCalledWith([100001]);
  });

  it("returns 'Unknown Member' for unresolved member IDs", async () => {
    mockPrisma.messageRecipient.findMany.mockResolvedValue([
      { memberId: 99999, channel: "email", status: "sent", sentAt: new Date() },
    ] as never);
    mockGetMemberDetails.mockResolvedValue([]);

    const result = await getMessageRecipients(1);

    expect(result[0].memberName).toBe("Unknown Member");
  });

  it("throws on database error", async () => {
    mockPrisma.messageRecipient.findMany.mockRejectedValue(new Error("Connection lost"));

    await expect(getMessageRecipients(1)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("previewRecipientCounts", () => {
  it("returns email eligible, sms eligible, and sms ineligible counts", async () => {
    mockPrisma.contactGroupMember.count.mockResolvedValueOnce(10).mockResolvedValueOnce(6).mockResolvedValueOnce(12);

    const result = await previewRecipientCounts(1);

    expect(result).toEqual({ emailEligible: 10, smsEligible: 6, smsIneligible: 6 });
  });

  it("throws on database error", async () => {
    mockPrisma.contactGroupMember.count.mockRejectedValue(new Error("Connection lost"));

    await expect(previewRecipientCounts(1)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("getMessageHistoryPage", () => {
  const makeMessages = (count: number, startId: number = 1) =>
    Array.from({ length: count }, (_, i) => ({
      id: startId + i,
      subject: `Message ${startId + i}`,
      body: `Body ${startId + i}`,
      sentAt: new Date(`2026-04-${String(startId + i).padStart(2, "0")}`),
      emailCount: 5,
      smsCount: 0,
      failedCount: 0,
      isBlast: false,
      groups: [{ group: { name: "Garden Club" } }],
    }));

  it("returns first page with nextCursor and null prevCursor", async () => {
    mockPrisma.message.findMany.mockResolvedValue(makeMessages(26) as never);
    mockPrisma.message.count.mockResolvedValue(50);

    const result = await getMessageHistoryPage({});

    expect(result.items).toHaveLength(25);
    expect(result.totalCount).toBe(50);
    expect(result.nextCursor).toBe(25);
    expect(result.prevCursor).toBeNull();
  });

  it("returns last page with null nextCursor", async () => {
    mockPrisma.message.findMany.mockResolvedValue(makeMessages(10) as never);
    mockPrisma.message.count.mockResolvedValue(35);

    const result = await getMessageHistoryPage({ cursor: 25, direction: "forward" });

    expect(result.items).toHaveLength(10);
    expect(result.nextCursor).toBeNull();
    expect(result.prevCursor).toBe(1);
  });

  it("filters by senderId", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);
    mockPrisma.message.count.mockResolvedValue(0);

    await getMessageHistoryPage({ senderId: 100001 });

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ senderId: 100001 }) }),
    );
  });

  it("filters by channel", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);
    mockPrisma.message.count.mockResolvedValue(0);

    await getMessageHistoryPage({ channel: "email" });

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ recipients: { some: { channel: "email" } } }) }),
    );
  });

  it("filters by search term", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);
    mockPrisma.message.count.mockResolvedValue(0);

    await getMessageHistoryPage({ search: "hello" });

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ subject: { contains: "hello" } }) }),
    );
  });

  it("sorts by oldest when specified", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);
    mockPrisma.message.count.mockResolvedValue(0);

    await getMessageHistoryPage({ sort: "oldest" });

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { sentAt: "asc" } }));
  });

  it("respects pageSize parameter", async () => {
    mockPrisma.message.findMany.mockResolvedValue(makeMessages(11) as never);
    mockPrisma.message.count.mockResolvedValue(20);

    const result = await getMessageHistoryPage({ pageSize: 10 });

    expect(result.items).toHaveLength(10);
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 11 }));
  });

  it("returns empty items with totalCount 0 when no matches", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);
    mockPrisma.message.count.mockResolvedValue(0);

    const result = await getMessageHistoryPage({ search: "nonexistent" });

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.nextCursor).toBeNull();
    expect(result.prevCursor).toBeNull();
  });

  it("throws on database error", async () => {
    mockPrisma.message.findMany.mockRejectedValue(new Error("Connection lost"));

    await expect(getMessageHistoryPage({})).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
