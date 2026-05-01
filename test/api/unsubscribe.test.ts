import "../mocks/prisma";
import "../mocks/encryption";
import { mockPrisma } from "../mocks";
import { POST } from "@/app/api/unsubscribe/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/unsubscribe-tokens", () => ({
  verifyUnsubscribeToken: vi.fn(),
}));

import { verifyUnsubscribeToken } from "@/lib/unsubscribe-tokens";

describe("POST /api/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 without token", async () => {
    const req = new NextRequest("http://localhost/api/unsubscribe", {
      method: "POST",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid token", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValue({
      valid: false,
      error: "Invalid token",
    });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=bad", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 for expired token", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValue({
      valid: false,
      error: "Token expired",
    });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=expired-token", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 204 and updates database for valid token", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValue({
      valid: true,
      memberId: 123,
      groupId: 456,
    });
    mockPrisma.contactGroupMember.updateMany.mockResolvedValue({ count: 1 });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(mockPrisma.contactGroupMember.updateMany).toHaveBeenCalledWith({
      where: { memberId: 123, groupId: 456 },
      data: {
        notifyEmail: false,
        unsubscribedAt: expect.any(Date),
        unsubscribeMethod: "one-click",
      },
    });
  });

  it("returns 204 on double unsubscribe (idempotent)", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValue({
      valid: true,
      memberId: 123,
      groupId: 456,
    });
    mockPrisma.contactGroupMember.updateMany.mockResolvedValue({ count: 0 });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(204);
  });

  it("returns 500 on database error", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValue({
      valid: true,
      memberId: 123,
      groupId: 456,
    });
    mockPrisma.contactGroupMember.updateMany.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});
