import { vi } from "vitest";
import { groupAlpha, memberAlice, memberBob } from "../mocks/contact-groups";
import { mockGetMemberDetails } from "../mocks/member-api";
import { enrichGroupMembers } from "@/services/contact-group";
import type { GroupWithMembers } from "@/services/contact-group";

const mockGroup: GroupWithMembers = {
  ...groupAlpha,
  members: [memberAlice, memberBob],
  memberCount: 2,
};

describe("enrichGroupMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps member details onto group members", async () => {
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 10, ownername: "Alice Smith", owneremail: "alice@example.com", ownerphone: "+15550001" },
      { ownerid: 20, ownername: "Bob Jones", owneremail: "bob@example.com", ownerphone: "+15550002" },
    ]);

    const result = await enrichGroupMembers(mockGroup);

    expect(result.members).toHaveLength(2);
    expect(result.members[0].ownername).toBe("Alice Smith");
    expect(result.members[0].owneremail).toBe("alice@example.com");
    expect(result.members[1].ownername).toBe("Bob Jones");
    expect(result.members[1].owneremail).toBe("bob@example.com");
    expect(result.memberCount).toBe(2);
  });

  it("handles empty member list without calling API", async () => {
    const emptyGroup: GroupWithMembers = { ...groupAlpha, members: [], memberCount: 0 };

    const result = await enrichGroupMembers(emptyGroup);

    expect(result.members).toEqual([]);
    expect(mockGetMemberDetails).not.toHaveBeenCalled();
  });

  it("falls back to Unknown Member when member not found in portal", async () => {
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 10, ownername: "Alice Smith", owneremail: "alice@example.com", ownerphone: "+15550001" },
    ]);

    const result = await enrichGroupMembers(mockGroup);

    expect(result.members[0].ownername).toBe("Alice Smith");
    expect(result.members[1].ownername).toBe("Unknown Member");
    expect(result.members[1].owneremail).toBe("");
  });

  it("handles partial API response", async () => {
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 20, ownername: "Bob Jones", owneremail: "bob@example.com", ownerphone: "+15550002" },
    ]);

    const result = await enrichGroupMembers(mockGroup);

    expect(result.members[0].ownername).toBe("Unknown Member");
    expect(result.members[1].ownername).toBe("Bob Jones");
  });

  it("calls getMemberDetails once with all member IDs", async () => {
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 10, ownername: "Alice Smith", owneremail: "alice@example.com", ownerphone: "+15550001" },
      { ownerid: 20, ownername: "Bob Jones", owneremail: "bob@example.com", ownerphone: "+15550002" },
    ]);

    await enrichGroupMembers(mockGroup);

    expect(mockGetMemberDetails).toHaveBeenCalledTimes(1);
    expect(mockGetMemberDetails).toHaveBeenCalledWith([10, 20]);
  });

  it("falls back for all members when API returns empty array", async () => {
    mockGetMemberDetails.mockResolvedValue([]);

    const result = await enrichGroupMembers(mockGroup);

    expect(result.members[0].ownername).toBe("Unknown Member");
    expect(result.members[0].owneremail).toBe("");
    expect(result.members[1].ownername).toBe("Unknown Member");
    expect(result.members[1].owneremail).toBe("");
  });

  it("preserves original member fields alongside enriched fields", async () => {
    mockGetMemberDetails.mockResolvedValue([
      { ownerid: 10, ownername: "Alice Smith", owneremail: "alice@example.com", ownerphone: "+15550001" },
    ]);

    const result = await enrichGroupMembers(mockGroup);

    expect(result.members[0].memberId).toBe(10);
    expect(result.members[0].groupId).toBe(1);
    expect(result.members[0].notifyEmail).toBe(true);
    expect(result.members[0].ownername).toBe("Alice Smith");
  });

  it("throws on API error", async () => {
    mockGetMemberDetails.mockRejectedValue(new Error("API unavailable"));

    await expect(enrichGroupMembers(mockGroup)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});
