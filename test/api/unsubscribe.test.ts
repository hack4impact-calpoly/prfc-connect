import "../mocks/prisma";
import { prismaMock } from "../mocks";
import { POST } from "@/app/api/unsubscribe/route";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-tokens";
import { NextRequest } from "next/server";

vi.mock("@/lib/unsubscribe-tokens", () => ({
  verifyUnsubscribeToken: vi.fn(),
}));

describe("POST /api/unsubscribe", () => {
  it("returns 400 without token", async () => {
    const req = new NextRequest("http://localhost/api/unsubscribe", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid token", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValueOnce({
      valid: false,
      error: "Invalid token",
    });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=bad", { method: "POST" });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for expired token", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValueOnce({
      valid: false,
      error: "Token expired",
    });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=expired-token", { method: "POST" });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 204 for valid token", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValueOnce({
      valid: true,
      memberId: 123,
      groupId: 456,
    });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", { method: "POST" });

    const res = await POST(req);
    expect(res.status).toBe(204);
  });

  it("updates notifyEmail: false in database", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValueOnce({
      valid: true,
      memberId: 123,
      groupId: 456,
    });

    prismaMock.contactGroupMember.updateMany.mockResolvedValueOnce({
      count: 1,
    });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", { method: "POST" });

    await POST(req);

    const args = prismaMock.contactGroupMember.updateMany.mock.calls[0][0];
    expect(prismaMock.contactGroupMember.updateMany).toHaveBeenCalledTimes(1);
    expect(args.data.notifyEmail).toBe(false);
  });

  it("sets unsubscribedAt and unsubscribeMethod", async () => {
    vi.mocked(verifyUnsubscribeToken).mockReturnValueOnce({
      valid: true,
      memberId: 123,
      groupId: 456,
    });

    prismaMock.contactGroupMember.updateMany.mockResolvedValueOnce({ count: 1 });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", { method: "POST" });

    await POST(req);

    const args = prismaMock.contactGroupMember.updateMany.mock.calls[0][0];
    expect(args.data.unsubscribeMethod).toBe("one-click");
    expect(args.data.unsubscribedAt).toBeInstanceOf(Date);
  });
});
