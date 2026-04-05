import { mockPrisma } from "../mocks/prisma";
import { getRecentActivity } from "@/services/dashboard";

describe("getRecentActivity", () => {
  it("merges messages and events sorted by timestamp descending", async () => {
    mockPrisma.message.findMany.mockResolvedValue([
      { subject: "Hello", sentAt: new Date("2026-04-03"), emailCount: 10 },
    ] as never);
    mockPrisma.event.findMany.mockResolvedValue([{ title: "Town Hall", createdAt: new Date("2026-04-04") }] as never);

    const result = await getRecentActivity(5);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("event_created");
    expect(result[0].title).toBe("Event Created: Town Hall");
    expect(result[1].type).toBe("message_sent");
    expect(result[1].title).toBe("Message sent to 10 Members");
  });

  it("limits to requested count", async () => {
    mockPrisma.message.findMany.mockResolvedValue([
      { subject: "A", sentAt: new Date("2026-04-01"), emailCount: 1 },
      { subject: "B", sentAt: new Date("2026-04-02"), emailCount: 2 },
      { subject: "C", sentAt: new Date("2026-04-03"), emailCount: 3 },
    ] as never);
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    const result = await getRecentActivity(2);

    expect(result).toHaveLength(2);
  });

  it("returns empty array when no activity exists", async () => {
    mockPrisma.message.findMany.mockResolvedValue([] as never);
    mockPrisma.event.findMany.mockResolvedValue([] as never);

    const result = await getRecentActivity(5);

    expect(result).toEqual([]);
  });

  it("throws on database error", async () => {
    mockPrisma.message.findMany.mockRejectedValue(new Error("Connection lost"));

    await expect(getRecentActivity(5)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
