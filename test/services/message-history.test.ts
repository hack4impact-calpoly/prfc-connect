import "../mocks/contact-group-service";
import "../mocks/email-service";
import "../mocks/member-api";
import { mockPrisma } from "../mocks/prisma";
import { getGroupMessageHistory } from "@/services/message";

vi.mock("@/env", () => ({
  env: { SMS_ENABLED: false, FROM_EMAIL: "no-reply@prfc.coop" },
}));

const testMessages = [
  {
    id: 3,
    subject: "Latest Update",
    body: "Body of latest update",
    sentAt: new Date("2024-01-17T10:00:00Z"),
    senderId: 100001,
    emailCount: 5,
    smsCount: 0,
    failedCount: 0,
  },
  {
    id: 2,
    subject: "Second Message",
    body: "Body of second message",
    sentAt: new Date("2024-01-16T10:00:00Z"),
    senderId: 100001,
    emailCount: 3,
    smsCount: 0,
    failedCount: 1,
  },
  {
    id: 1,
    subject: "First Message",
    body: "Body of first message",
    sentAt: new Date("2024-01-15T10:00:00Z"),
    senderId: 100002,
    emailCount: 4,
    smsCount: 0,
    failedCount: 0,
  },
];

describe("getGroupMessageHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns messages ordered by sentAt desc", async () => {
    mockPrisma.message.findMany.mockResolvedValue(testMessages as never);

    const result = await getGroupMessageHistory(5);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(1);
  });

  it("uses select with only summary fields", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getGroupMessageHistory(5);

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
      where: { groups: { some: { groupId: 5 } } },
      select: {
        id: true,
        subject: true,
        body: true,
        sentAt: true,
        senderId: true,
        emailCount: true,
        smsCount: true,
        failedCount: true,
      },
      orderBy: { sentAt: "desc" },
      take: 20,
    });
  });

  it("applies default limit of 20", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getGroupMessageHistory(5);

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20 }));
  });

  it("respects custom limit", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getGroupMessageHistory(5, 10);

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
  });

  it("clamps limit to max of 100", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getGroupMessageHistory(5, 500);

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });

  it("clamps zero limit to 1", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getGroupMessageHistory(5, 0);

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 1 }));
  });

  it("clamps negative limit to 1", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    await getGroupMessageHistory(5, -5);

    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 1 }));
  });

  it("returns empty array when no messages exist", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);

    const result = await getGroupMessageHistory(999);

    expect(result).toEqual([]);
  });

  it("throws INTERNAL_ERROR on database failure", async () => {
    mockPrisma.message.findMany.mockRejectedValue(new Error("Database down"));

    await expect(getGroupMessageHistory(5)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});
