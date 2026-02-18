import { GET } from "@/app/api/members/[id]/route";
import { NextRequest } from "next/server";
import { AppError } from "@/utils/errors";

// Mock Verify Session
vi.mock("@/lib/dal", () => ({
  verifySession: vi.fn(),
}));

// Mock API
vi.mock("@/lib/api/member-api", () => ({
  getMemberById: vi.fn(),
}));

import { verifySession } from "@/lib/dal";
import { getMemberById } from "@/lib/api/member-api";

describe("GET /api/members/[id]", () => {
  it("returns 401 without session", async () => {
    vi.mocked(verifySession).mockRejectedValueOnce(new AppError("UNAUTHORIZED", "Authentication required"));

    const req = new NextRequest("http://localhost/api/members/1");

    const res = await GET(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(res.status).toBe(401);
  });

  it("returns member details", async () => {
    const fakeMember = {
      ownerid: 1,
      ownername: "Alice",
      owneremail: "alice@example.com",
      ownerphone: "555-0000",
    };
    vi.mocked(getMemberById).mockResolvedValueOnce(fakeMember);

    const res = await GET(new NextRequest("http://localhost/api/members/1"), { params: Promise.resolve({ id: "1" }) });

    expect(await res.json()).toEqual(fakeMember);
  });

  it("returns 404 for non-existent member", async () => {
    vi.mocked(getMemberById).mockResolvedValueOnce(null);

    const res = await GET(new NextRequest("http://localhost/api/members/999"), {
      params: Promise.resolve({ id: "999" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid ID format", async () => {
    const res = await GET(new NextRequest("http://localhost/api/members/abc"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(res.status).toBe(400);
  });
});
