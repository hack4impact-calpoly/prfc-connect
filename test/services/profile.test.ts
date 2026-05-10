import { vi } from "vitest";
import { mockGetMemberById } from "../mocks/member-api";
import { getMemberProfile } from "@/services/profile";
import { memberKermit } from "../mocks/members";

describe("getMemberProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns profile with split name and admin role", async () => {
    mockGetMemberById.mockResolvedValue(memberKermit);

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
    mockGetMemberById.mockResolvedValue(memberKermit);

    const result = await getMemberProfile(100001, false);

    expect(result.role).toBe("Member");
  });

  it("throws NOT_FOUND when member does not exist", async () => {
    mockGetMemberById.mockResolvedValue(null);

    await expect(getMemberProfile(99999, false)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("handles member with no alt phone", async () => {
    mockGetMemberById.mockResolvedValue({ ...memberKermit, owneraltphone: undefined });

    const result = await getMemberProfile(100001, false);

    expect(result.altPhone).toBeUndefined();
  });
});
