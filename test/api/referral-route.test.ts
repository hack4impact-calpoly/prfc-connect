/**
 * @jest-environment node
 */
import "../mocks/email";
import "../mocks/rate-limit";
import "../mocks/idempotency";
import "../mocks/csrf";
import {
  prismaMock,
  createMockRequest,
  allReferrals,
  formWithTwoProspects,
  referralCharlie,
  emailTransportMock,
  rateLimiterMock,
  mockGetIdempotentResponse,
  mockValidateOrigin,
} from "../mocks";
import { GET, POST } from "@/app/api/referral/route";

describe("GET /api/referral", () => {
  it("returns all referrals as JSON", async () => {
    prismaMock.referral.findMany.mockResolvedValue(allReferrals);
    const req = createMockRequest({ cookies: { prfc_database_access: "verified" } });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
  });

  it("returns 401 without valid cookie", async () => {
    const req = createMockRequest();

    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    prismaMock.referral.findMany.mockRejectedValue(new Error("Connection lost"));
    const req = createMockRequest({ cookies: { prfc_database_access: "verified" } });

    const response = await GET(req);

    expect(response.status).toBe(500);
  });
});

describe("POST /api/referral", () => {
  it("creates referrals and sends emails", async () => {
    const createdReferrals = [
      { ...referralCharlie, id: 7 },
      { ...referralCharlie, id: 8, prospectName: "Marcie Johnson", prospectEmail: "marcie.johnson@yahoo.com" },
    ];
    prismaMock.$transaction.mockResolvedValue(createdReferrals);

    const req = createMockRequest({ body: formWithTwoProspects });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.referrals).toHaveLength(2);
    expect(emailTransportMock.sendMail).toHaveBeenCalledTimes(2);
  });

  it("returns 400 on invalid form data", async () => {
    const invalidBody = { memberName: "Test", memberEmail: "not-an-email" };
    const req = createMockRequest({ body: invalidBody });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it("returns 500 when email fails", async () => {
    emailTransportMock.sendMail.mockRejectedValueOnce(new Error("SMTP down"));
    const req = createMockRequest({ body: formWithTwoProspects });

    const response = await POST(req);

    expect(response.status).toBe(500);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    rateLimiterMock.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });
    const req = createMockRequest({
      body: formWithTwoProspects,
      headers: { "x-forwarded-for": "203.0.113.42" },
    });

    const response = await POST(req);

    expect(response.status).toBe(429);
  });

  it("returns cached response for duplicate idempotency key", async () => {
    const cachedBody = { message: "Referrals created successfully!", referrals: [referralCharlie] };
    mockGetIdempotentResponse.mockResolvedValueOnce({ status: 201, body: cachedBody });

    const req = createMockRequest({
      body: formWithTwoProspects,
      headers: { "idempotency-key": "dup-key-7f3a9b2c" },
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.referrals).toHaveLength(1);
    expect(emailTransportMock.sendMail).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 403 for cross-origin request", async () => {
    mockValidateOrigin.mockReturnValueOnce(false);

    const req = createMockRequest({
      body: formWithTwoProspects,
      headers: { origin: "https://malicious-site.com" },
    });
    const response = await POST(req);

    expect(response.status).toBe(403);
    expect(emailTransportMock.sendMail).not.toHaveBeenCalled();
  });
});
