import "../mocks/rate-limit";
import "../mocks/dal";
import "../mocks/member-api";
import { mockVerifySession, mockMembersRateLimiter, mockGetAllMembers } from "../mocks";
import { GET } from "@/app/api/members/route";
import { NextRequest } from "next/server";
import { AppError } from "@/utils/errors";

const testSession = { ownerid: 100001, isAdmin: false };
const fakeMembers = [
  { ownerid: 1, ownername: "Alice" },
  { ownerid: 2, ownername: "Bob" },
];

describe("GET /api/members", () => {
  beforeEach(() => {
    mockVerifySession.mockResolvedValue(testSession);
  });

  it("returns member list with valid session", async () => {
    mockGetAllMembers.mockResolvedValue(fakeMembers);

    const req = new NextRequest("http://localhost/api/members");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fakeMembers);
  });

  it("returns 401 without session", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const req = new NextRequest("http://localhost/api/members");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockMembersRateLimiter.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new NextRequest("http://localhost/api/members", {
      headers: { "x-forwarded-for": "1.1.1.1" },
    });
    const res = await GET(req);

    expect(res.status).toBe(429);
  });

  it("returns 500 on unexpected error", async () => {
    mockGetAllMembers.mockRejectedValue(new Error("Connection lost"));

    const req = new NextRequest("http://localhost/api/members");
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
