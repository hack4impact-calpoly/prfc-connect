import { vi } from "vitest";

vi.mock("@/lib/dal", () => ({
  generateToken: vi.fn().mockReturnValue("mock-token"),
}));

import { POST } from "@/app/api/dev/token/route";
import { NextRequest } from "next/server";

describe("POST /api/dev/token", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalMockApi = process.env.USE_MOCK_MEMBER_API;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    process.env.USE_MOCK_MEMBER_API = originalMockApi;
  });

  it("returns 404 in production when USE_MOCK_MEMBER_API is not set", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.USE_MOCK_MEMBER_API;

    const req = new NextRequest("http://localhost:3000/api/dev/token", {
      method: "POST",
      body: JSON.stringify({ ownerid: 100001, isAdmin: true }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not available");
  });

  it("allows access in production when USE_MOCK_MEMBER_API is true (staging)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.USE_MOCK_MEMBER_API = "true";

    const req = new NextRequest("http://localhost:3000/api/dev/token", {
      method: "POST",
      body: JSON.stringify({ ownerid: 100001, isAdmin: false }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("mock-token");
  });

  it("allows access in non-production environments", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";

    const req = new NextRequest("http://localhost:3000/api/dev/token", {
      method: "POST",
      body: JSON.stringify({ ownerid: 100001, isAdmin: false }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});
