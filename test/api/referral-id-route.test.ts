import "../mocks/dal";
import "../mocks/csrf";
import "../mocks/encryption";
import { mockPrisma, createMockRequest, referralCharlie, mockRequireAdmin, mockValidateOrigin } from "../mocks";
import { PATCH, DELETE } from "@/app/api/referrals/[id]/route";
import { AppError } from "@/utils/errors";

function createParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/referrals/[id]", () => {
  beforeEach(() => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100184, isAdmin: true });
  });

  it("updates redeemed status", async () => {
    mockPrisma.referral.update.mockResolvedValue({ ...referralCharlie, redeemed: true });

    const req = createMockRequest({ body: { redeemed: true } });
    const response = await PATCH(req, createParams("1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.redeemed).toBe(true);
  });

  it("returns 401 without valid session", async () => {
    mockRequireAdmin.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const req = createMockRequest({ body: { redeemed: true } });
    const response = await PATCH(req, createParams("1"));

    expect(response.status).toBe(401);
  });

  it("returns 400 for non-numeric ID", async () => {
    const req = createMockRequest({ body: { redeemed: true } });
    const response = await PATCH(req, createParams("abc"));

    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid body", async () => {
    const req = createMockRequest({ body: { redeemed: "not-a-boolean" } });
    const response = await PATCH(req, createParams("1"));

    expect(response.status).toBe(400);
  });

  it("returns 403 for cross-origin request", async () => {
    mockValidateOrigin.mockReturnValueOnce(false);

    const req = createMockRequest({ body: { redeemed: true } });
    const response = await PATCH(req, createParams("1"));

    expect(response.status).toBe(403);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.referral.update.mockRejectedValue(new Error("Connection lost"));

    const req = createMockRequest({ body: { redeemed: true } });
    const response = await PATCH(req, createParams("1"));

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/referrals/[id]", () => {
  beforeEach(() => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100184, isAdmin: true });
  });

  it("deletes referral successfully", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(referralCharlie);
    mockPrisma.referral.delete.mockResolvedValue(referralCharlie);

    const req = createMockRequest();
    const response = await DELETE(req, createParams("1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Referral deleted");
  });

  it("returns 401 without valid session", async () => {
    mockRequireAdmin.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const req = createMockRequest();
    const response = await DELETE(req, createParams("1"));

    expect(response.status).toBe(401);
  });

  it("returns 400 for non-numeric ID", async () => {
    const req = createMockRequest();
    const response = await DELETE(req, createParams("abc"));

    expect(response.status).toBe(400);
  });

  it("returns 404 for non-existent referral", async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(null);

    const req = createMockRequest();
    const response = await DELETE(req, createParams("999"));

    expect(response.status).toBe(404);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.referral.findUnique.mockRejectedValue(new Error("Connection lost"));

    const req = createMockRequest();
    const response = await DELETE(req, createParams("1"));

    expect(response.status).toBe(500);
  });
});
