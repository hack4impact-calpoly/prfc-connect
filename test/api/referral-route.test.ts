import "../mocks/email";
import "../mocks/rate-limit";
import "../mocks/idempotency";
import "../mocks/csrf";
import "../mocks/dal";
import "../mocks/encryption";
import {
  mockPrisma,
  createMockRequest,
  allReferrals,
  formWithTwoProspects,
  referralCharlie,
  mockBrevoSend,
  mockRateLimiter,
  mockGetIdempotentResponse,
  mockValidateOrigin,
  mockVerifySession,
  mockRequireAdmin,
} from "../mocks";
import { GET, POST } from "@/app/api/referrals/route";
import { AppError } from "@/utils/errors";

describe("GET /api/referrals", () => {
  beforeEach(() => {
    mockRequireAdmin.mockReset();
  });

  it("returns all referrals as JSON", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100184, isAdmin: true });
    mockPrisma.referral.findMany.mockResolvedValue(allReferrals);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
  });

  it("returns 401 without valid session", async () => {
    mockRequireAdmin.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100184, isAdmin: true });
    mockPrisma.referral.findMany.mockRejectedValue(new Error("Connection lost"));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});

describe("POST /api/referrals", () => {
  beforeEach(() => {
    mockVerifySession.mockReset();
    mockVerifySession.mockResolvedValue({ ownerid: 100184, isAdmin: false });
  });

  it("creates referrals and sends emails", async () => {
    const createdReferrals = [
      { ...referralCharlie, id: 7 },
      { ...referralCharlie, id: 8, prospectName: "Marcie Johnson", prospectEmail: "marcie.johnson@yahoo.com" },
    ];
    mockPrisma.$transaction.mockResolvedValue(createdReferrals);

    const req = createMockRequest({ body: formWithTwoProspects });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.referrals).toHaveLength(2);
    expect(mockBrevoSend).toHaveBeenCalledTimes(2);
  });

  it("returns 401 without valid session", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const req = createMockRequest({ body: formWithTwoProspects });
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid form data", async () => {
    const invalidBody = { memberName: "Test", memberEmail: "not-an-email" };
    const req = createMockRequest({ body: invalidBody });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it("returns 500 when email fails", async () => {
    mockBrevoSend.mockRejectedValueOnce(new Error("Send failed"));
    const req = createMockRequest({ body: formWithTwoProspects });

    const response = await POST(req);

    expect(response.status).toBe(500);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimiter.mockResolvedValueOnce({
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

  it("returns 403 for cross-origin request", async () => {
    mockValidateOrigin.mockReturnValueOnce(false);

    const req = createMockRequest({
      body: formWithTwoProspects,
      headers: { origin: "https://malicious-site.com" },
    });
    const response = await POST(req);

    expect(response.status).toBe(403);
    expect(mockBrevoSend).not.toHaveBeenCalled();
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
    expect(mockBrevoSend).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
