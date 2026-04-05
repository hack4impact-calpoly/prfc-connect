import { vi, type MockedFunction } from "vitest";

vi.mock("@/lib/api/member-api", () => ({
  getMemberById: vi.fn(),
}));

import { getMemberById } from "@/lib/api/member-api";
import { getMemberProfile } from "@/services/profile";

const mockGetMemberById = getMemberById as MockedFunction<typeof getMemberById>;

const mockMember = {
  ownerid: 100001,
  ownername: "Kermit Komm",
  owneremail: "kermit@coop.org",
  ownerphone: "805-555-1234",
  owneraltphone: "805-555-5678",
};

describe("getMemberProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns profile with split name and admin role", async () => {
    mockGetMemberById.mockResolvedValue(mockMember);

    const result = await getMemberProfile(100001, true);

    expect(result).toEqual({
      firstName: "Kermit",
      lastName: "Komm",
      email: "kermit@coop.org",
      phone: "805-555-1234",
      altPhone: "805-555-5678",
      role: "Admin",
    });
  });

  it("returns member role when isAdmin is false", async () => {
    mockGetMemberById.mockResolvedValue(mockMember);

    const result = await getMemberProfile(100001, false);

    expect(result.role).toBe("Member");
  });

  it("throws NOT_FOUND when member does not exist", async () => {
    mockGetMemberById.mockResolvedValue(null);

    await expect(getMemberProfile(99999, false)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("handles member with no alt phone", async () => {
    mockGetMemberById.mockResolvedValue({ ...mockMember, owneraltphone: undefined });

    const result = await getMemberProfile(100001, false);

    expect(result.altPhone).toBeUndefined();
  });
});
