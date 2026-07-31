import "../mocks/dal";
import "../mocks/member-api";
import { mockVerifySession, mockGetAllMembers } from "../mocks";
import { GET } from "@/app/api/members/route";
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

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fakeMembers);
  });

  it("returns 401 without session", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    mockGetAllMembers.mockRejectedValue(new Error("Connection lost"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
