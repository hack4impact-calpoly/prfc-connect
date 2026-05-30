import { vi } from "vitest";
import "../mocks/dal";
import "../mocks/encryption";
import { mockPrisma } from "../mocks/prisma";
import { allReferrals } from "../mocks/referrals";
import { mockRequireAdmin } from "../mocks/dal";
import { AppError } from "@/utils/errors";

vi.mock("@/services/referral-pdf", () => ({
  generateReferralPdf: vi.fn().mockReturnValue(Buffer.from("PDF_CONTENT")),
}));

import { generateReferralPdf } from "@/services/referral-pdf";
import { GET } from "@/app/api/referrals/export/route";
import { NextRequest } from "next/server";

function createGetRequest(query: string) {
  return new NextRequest(`http://localhost:3000/api/referrals/export?${query}`, { method: "GET" });
}

describe("GET /api/referrals/export", () => {
  beforeEach(() => {
    vi.mocked(generateReferralPdf).mockClear();
    mockPrisma.referral.findMany.mockResolvedValue(allReferrals);
  });

  it("returns a PDF with admin session for requested ids", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100001, isAdmin: true });

    const req = createGetRequest("ids=1,2");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toMatch(/^attachment; filename="referrals-\d{4}-\d{2}-\d{2}\.pdf"$/);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("logs an audit line with ownerid and count before generating", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    mockRequireAdmin.mockResolvedValue({ ownerid: 100001, isAdmin: true });

    const req = createGetRequest("ids=1,2,3");
    await GET(req);

    expect(spy).toHaveBeenCalledWith("[AUDIT] referral_pdf_export", 100001, 3);
    spy.mockRestore();
  });

  it("returns 403 when caller is not admin", async () => {
    mockRequireAdmin.mockRejectedValue(new AppError("FORBIDDEN", "Admin access required"));

    const req = createGetRequest("ids=1,2");
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(generateReferralPdf).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    mockRequireAdmin.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const req = createGetRequest("ids=1,2");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(generateReferralPdf).not.toHaveBeenCalled();
  });

  it("returns 400 when ids param is missing", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100001, isAdmin: true });

    const req = createGetRequest("");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(generateReferralPdf).not.toHaveBeenCalled();
  });

  it("returns 400 when ids param has non-numeric values", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100001, isAdmin: true });

    const req = createGetRequest("ids=abc,xyz");
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(generateReferralPdf).not.toHaveBeenCalled();
  });

  it("returns 400 when ids list exceeds 1000 entries", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100001, isAdmin: true });

    const tooMany = Array.from({ length: 1001 }, (_, i) => i + 1).join(",");
    const req = createGetRequest(`ids=${tooMany}`);
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(generateReferralPdf).not.toHaveBeenCalled();
  });

  it("filters to only the requested ids before generating", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100001, isAdmin: true });

    const req = createGetRequest("ids=2");
    await GET(req);

    expect(generateReferralPdf).toHaveBeenCalledTimes(1);
    const call = vi.mocked(generateReferralPdf).mock.calls[0][0];
    expect(call.referrals).toHaveLength(1);
    expect(call.referrals[0].id).toBe(2);
    expect(call.exportedByOwnerid).toBe(100001);
  });

  it("tolerates ids that do not exist in the database", async () => {
    mockRequireAdmin.mockResolvedValue({ ownerid: 100001, isAdmin: true });

    const req = createGetRequest("ids=1,9999");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const call = vi.mocked(generateReferralPdf).mock.calls[0][0];
    expect(call.referrals).toHaveLength(1);
    expect(call.referrals[0].id).toBe(1);
  });
});
