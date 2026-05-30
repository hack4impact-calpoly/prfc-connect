import "../mocks/prisma";
import "../mocks/encryption";
import "../mocks/email-suppression";
import "../mocks/unsubscribe-tokens";
import "../mocks/member-api";
import {
  mockVerifyUnsubscribeToken,
  mockVerifyEmailUnsubscribeToken,
  mockSuppressEmail,
  mockGetMemberById,
} from "../mocks";
import { GET, POST } from "@/app/api/unsubscribe/route";
import { NextRequest } from "next/server";

describe("GET /api/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to the unsubscribe page preserving the token", () => {
    const req = new NextRequest("http://localhost/api/unsubscribe?token=abc123", { method: "GET" });
    const res = GET(req);

    expect(res.status).toBe(302);
    const location = res.headers.get("location");
    expect(location).toContain("/unsubscribe");
    expect(location).toContain("token=abc123");
    expect(mockSuppressEmail).not.toHaveBeenCalled();
  });

  it("redirects to the unsubscribe page when no token is present", () => {
    const req = new NextRequest("http://localhost/api/unsubscribe", { method: "GET" });
    const res = GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/unsubscribe");
  });
});

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
    mockVerifyUnsubscribeToken.mockReturnValue({
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
    mockVerifyUnsubscribeToken.mockReturnValue({
      valid: false,
      error: "Token expired",
    });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=expired-token", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 204 and suppresses email for valid legacy token", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue({
      valid: true,
      memberId: 123,
      groupId: 456,
    });
    mockGetMemberById.mockResolvedValue({
      ownerid: 123,
      ownername: "Test User",
      owneremail: "test@example.com",
      ownerphone: "555-0100",
    });

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(mockSuppressEmail).toHaveBeenCalledWith("test@example.com", "unsubscribe");
  });

  it("returns 204 when legacy token member not found", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue({
      valid: true,
      memberId: 999,
      groupId: 456,
    });
    mockGetMemberById.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(mockSuppressEmail).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue({
      valid: true,
      memberId: 123,
      groupId: 456,
    });
    mockGetMemberById.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost/api/unsubscribe?token=valid-token", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});

describe("POST /api/unsubscribe (email token)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 204 and suppresses email for valid referral token", async () => {
    const referralToken = Buffer.from("prospect@example.com|referral|12345|fakesig").toString("base64url");
    mockVerifyEmailUnsubscribeToken.mockReturnValue({
      valid: true,
      email: "prospect@example.com",
      timestamp: 12345,
    });

    const req = new NextRequest(`http://localhost/api/unsubscribe?token=${referralToken}`, {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(mockSuppressEmail).toHaveBeenCalledWith("prospect@example.com", "unsubscribe");
  });

  it("returns 400 for invalid referral token", async () => {
    const referralToken = Buffer.from("bad@example.com|referral|12345|badsig").toString("base64url");
    mockVerifyEmailUnsubscribeToken.mockReturnValue({
      valid: false,
      error: "Invalid signature",
    });

    const req = new NextRequest(`http://localhost/api/unsubscribe?token=${referralToken}`, {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockSuppressEmail).not.toHaveBeenCalled();
  });

  it("returns 500 when suppression fails", async () => {
    const referralToken = Buffer.from("test@example.com|referral|12345|fakesig").toString("base64url");
    mockVerifyEmailUnsubscribeToken.mockReturnValue({
      valid: true,
      email: "test@example.com",
      timestamp: 12345,
    });
    mockSuppressEmail.mockRejectedValueOnce(new Error("DB error"));

    const req = new NextRequest(`http://localhost/api/unsubscribe?token=${referralToken}`, {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});
