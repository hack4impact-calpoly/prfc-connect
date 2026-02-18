import { GET } from "@/app/api/members/route";
import { NextRequest } from "next/server";
import { AppError } from "@/utils/errors";

// Mock Verify Session
vi.mock("@/lib/dal", () => ({
  verifySession: vi.fn(),
}));

// Mock Rate Limiter
vi.mock("@/lib/rate-limit", () => ({
  membersRateLimiter: {
    limit: vi.fn(),
  },
}));

// Mock API
vi.mock("@/lib/api/member-api", () => ({
  getAllMembers: vi.fn(),
}));

import { verifySession } from "@/lib/dal";
import { membersRateLimiter } from "@/lib/rate-limit";
import { getAllMembers } from "@/lib/api/member-api";

describe("GET /api/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(membersRateLimiter!.limit).mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 10,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    });
  });

  it("returns 401 without session", async () => {
    vi.mocked(verifySession).mockRejectedValueOnce(new AppError("UNAUTHORIZED", "Authentication required"));

    const req = new NextRequest("http://localhost/api/members");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
  it("returns member list with session", async () => {
    vi.mocked(verifySession).mockResolvedValueOnce({} as never);

    const fakeMembers = [
      { ownerid: 1, ownername: "Alice" },
      { ownerid: 2, ownername: "Bob" },
    ];
    vi.mocked(getAllMembers).mockResolvedValueOnce(fakeMembers);

    const req = new NextRequest("http://localhost/api/members");
    const res = await GET(req);

    expect(await res.json()).toEqual(fakeMembers);
  });
  it("returns 429 when rate limited", async () => {
    vi.mocked(membersRateLimiter!.limit).mockResolvedValueOnce({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    });

    const req = new NextRequest("http://localhost/api/members", {
      headers: { "x-forwarded-for": "1.1.1.1" },
    });

    const res = await GET(req);

    expect(res.status).toBe(429);
  });
});
