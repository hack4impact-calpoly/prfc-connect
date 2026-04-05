import "../mocks/rate-limit";
import "../mocks/dal";
import { mockVerifySession, mockMembersRateLimiter } from "../mocks";
import { GET } from "@/app/api/members/[id]/route";
import { NextRequest } from "next/server";
import { AppError } from "@/utils/errors";

vi.mock("@/lib/api/member-api", () => ({
  getMemberById: vi.fn(),
}));

import { getMemberById } from "@/lib/api/member-api";

const testSession = { ownerid: 100001, isAdmin: false };
const fakeMember = {
  ownerid: 1,
  ownername: "Alice",
  owneremail: "alice@example.com",
  ownerphone: "555-0000",
};

describe("GET /api/members/[id]", () => {
  beforeEach(() => {
    mockVerifySession.mockResolvedValue(testSession);
  });

  it("returns member details with valid session", async () => {
    vi.mocked(getMemberById).mockResolvedValue(fakeMember);

    const req = new NextRequest("http://localhost/api/members/1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fakeMember);
  });

  it("returns 401 without session", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const req = new NextRequest("http://localhost/api/members/1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockMembersRateLimiter.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new NextRequest("http://localhost/api/members/1", {
      headers: { "x-forwarded-for": "1.1.1.1" },
    });
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid ID format", async () => {
    const req = new NextRequest("http://localhost/api/members/abc");
    const res = await GET(req, { params: Promise.resolve({ id: "abc" }) });

    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent member", async () => {
    vi.mocked(getMemberById).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/members/999");
    const res = await GET(req, { params: Promise.resolve({ id: "999" }) });

    expect(res.status).toBe(404);
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(getMemberById).mockRejectedValue(new Error("Connection lost"));

    const req = new NextRequest("http://localhost/api/members/1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(500);
  });
});
