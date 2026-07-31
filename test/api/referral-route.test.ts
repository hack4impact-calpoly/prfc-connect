import "../mocks/email";
import "../mocks/email-suppression";
import "../mocks/unsubscribe-tokens";
import "../mocks/csrf";
import "../mocks/dal";
import "../mocks/encryption";
import "../mocks/referral-signature";
import { mockPrisma } from "../mocks/prisma";
import { createMockRequest } from "../mocks/request";
import { allReferrals, formWithTwoProspects, referralCharlie } from "../mocks/referrals";
import { mockBrevoSend } from "../mocks/email";
import { mockValidateOrigin } from "../mocks/csrf";
import { mockVerifySession, mockRequireAdmin } from "../mocks/dal";
import { mockVerifyReferralSignature } from "../mocks/referral-signature";
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

  it("accepts anonymous submissions (no session required)", async () => {
    const createdReferrals = [{ ...referralCharlie, id: 7 }];
    mockPrisma.$transaction.mockResolvedValue(createdReferrals);

    const req = createMockRequest({ body: formWithTwoProspects });
    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(mockVerifySession).not.toHaveBeenCalled();
  });

  it("returns 403 when the referral signature is invalid", async () => {
    mockVerifyReferralSignature.mockReturnValueOnce(false);

    const req = createMockRequest({ body: formWithTwoProspects });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe("FORBIDDEN");
    expect(data.error.message).toBe("Invalid referral signature");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockBrevoSend).not.toHaveBeenCalled();
  });

  it("returns 400 when the signature is missing from the body", async () => {
    const bodyWithoutSignature = { ...formWithTwoProspects };
    delete (bodyWithoutSignature as { signature?: string }).signature;

    const req = createMockRequest({ body: bodyWithoutSignature });
    const response = await POST(req);

    expect(response.status).toBe(400);
    expect(mockVerifyReferralSignature).not.toHaveBeenCalled();
  });

  it("returns 400 when the signature is not 8 hex chars", async () => {
    const req = createMockRequest({ body: { ...formWithTwoProspects, signature: "not-hex!" } });
    const response = await POST(req);

    expect(response.status).toBe(400);
    expect(mockVerifyReferralSignature).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid form data", async () => {
    const invalidBody = { memberName: "Test", memberEmail: "not-an-email" };
    const req = createMockRequest({ body: invalidBody });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it("creates referrals even when email send fails", async () => {
    mockBrevoSend.mockRejectedValueOnce(new Error("Send failed"));
    const createdReferrals = [{ ...referralCharlie, id: 11 }];
    mockPrisma.$transaction.mockResolvedValue(createdReferrals);

    const req = createMockRequest({ body: formWithTwoProspects });

    const response = await POST(req);

    expect(response.status).toBe(500);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
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
});
