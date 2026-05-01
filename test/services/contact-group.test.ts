import { mockPrisma } from "../mocks/prisma";
import { groupAlpha, groupBravo, memberAlice } from "../mocks/contact-groups";
import {
  getGroupsByOwner,
  getAllGroups,
  getGroupById,
  isGroupOwner,
  createGroup,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  addMembersToGroup,
  removeMemberFromGroup,
  updateMemberNotifications,
  getGroupMembers,
  getGroupRecipients,
} from "@/services/contact-group";

describe("getGroupsByOwner", () => {
  it("returns groups with member count", async () => {
    const mockGroups = [
      { ...groupAlpha, _count: { members: 5 } },
      { ...groupBravo, _count: { members: 3 } },
    ];
    mockPrisma.contactGroup.findMany.mockResolvedValue(mockGroups as never);

    const result = await getGroupsByOwner(100);

    expect(mockPrisma.contactGroup.findMany).toHaveBeenCalledWith({
      where: { ownerid: 100 },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toHaveLength(2);
    expect(result[0].memberCount).toBe(5);
    expect(result[1].memberCount).toBe(3);
  });

  it("throws INTERNAL_ERROR on database failure", async () => {
    mockPrisma.contactGroup.findMany.mockRejectedValue(new Error("Database down"));

    await expect(getGroupsByOwner(100)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});

describe("getAllGroups", () => {
  it("returns all groups with member counts", async () => {
    const mockGroups = [
      { ...groupAlpha, _count: { members: 2 } },
      { ...groupBravo, _count: { members: 0 } },
    ];
    mockPrisma.contactGroup.findMany.mockResolvedValue(mockGroups as never);

    const result = await getAllGroups();

    expect(mockPrisma.contactGroup.findMany).toHaveBeenCalledWith({
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toHaveLength(2);
    expect(result[0].memberCount).toBe(2);
    expect(result[1].memberCount).toBe(0);
  });
});

describe("getGroupById", () => {
  it("returns group with members and count", async () => {
    const mockGroup = { ...groupAlpha, members: [memberAlice], _count: { members: 1 } };
    mockPrisma.contactGroup.findUnique.mockResolvedValue(mockGroup as never);

    const result = await getGroupById(1);

    expect(result.id).toBe(1);
    expect(result.members).toHaveLength(1);
    expect(result.memberCount).toBe(1);
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    mockPrisma.contactGroup.findUnique.mockResolvedValue(null);

    await expect(getGroupById(999)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("isGroupOwner", () => {
  it("returns true if group exists for owner", async () => {
    mockPrisma.contactGroup.findFirst.mockResolvedValue(groupAlpha as never);

    const result = await isGroupOwner(1, 100);

    expect(result).toBe(true);
  });

  it("returns false if group does not exist for owner", async () => {
    mockPrisma.contactGroup.findFirst.mockResolvedValue(null);

    const result = await isGroupOwner(1, 999);

    expect(result).toBe(false);
  });
});

describe("createGroup", () => {
  it("assigns owner during creation", async () => {
    const input = { name: "New Group", description: "Test" };
    mockPrisma.contactGroup.create.mockResolvedValue({ ...groupAlpha, ...input } as never);

    const result = await createGroup(input, 100);

    expect(mockPrisma.contactGroup.create).toHaveBeenCalledWith({
      data: { name: "New Group", description: "Test", ownerid: 100 },
    });
    expect(result.ownerid).toBe(100);
  });
});

describe("updateGroup", () => {
  it("applies partial update", async () => {
    const updateData = { name: "Updated Name" };
    mockPrisma.contactGroup.update.mockResolvedValue({ ...groupAlpha, ...updateData } as never);

    await updateGroup(1, updateData);

    expect(mockPrisma.contactGroup.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: updateData,
    });
  });
});

describe("deleteGroup", () => {
  it("deletes existing group", async () => {
    mockPrisma.contactGroup.delete.mockResolvedValue(groupAlpha as never);

    await deleteGroup(1);

    expect(mockPrisma.contactGroup.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});

describe("addMemberToGroup", () => {
  it("adds member with explicit preferences", async () => {
    mockPrisma.contactGroupMember.create.mockResolvedValue(memberAlice as never);

    await addMemberToGroup(1, 10, 100, { notifyEmail: true, notifySms: false });

    expect(mockPrisma.contactGroupMember.create).toHaveBeenCalledWith({
      data: { groupId: 1, memberId: 10, addedBy: 100, notifyEmail: true, notifySms: false },
    });
  });

  it("defaults to email enabled and sms disabled when no preferences given", async () => {
    mockPrisma.contactGroupMember.create.mockResolvedValue(memberAlice as never);

    await addMemberToGroup(1, 10, 100);

    expect(mockPrisma.contactGroupMember.create).toHaveBeenCalledWith({
      data: { groupId: 1, memberId: 10, addedBy: 100, notifyEmail: true, notifySms: false },
    });
  });
});

describe("addMembersToGroup", () => {
  it("bulk adds members and skips duplicates", async () => {
    mockPrisma.contactGroupMember.createMany.mockResolvedValue({ count: 2 });

    const members = [
      { memberId: 10, notifyEmail: true, notifySms: false },
      { memberId: 20, notifyEmail: false, notifySms: true },
    ];

    const result = await addMembersToGroup(1, members, 100);

    expect(mockPrisma.contactGroupMember.createMany).toHaveBeenCalledWith({
      data: [
        { groupId: 1, memberId: 10, addedBy: 100, notifyEmail: true, notifySms: false },
        { groupId: 1, memberId: 20, addedBy: 100, notifyEmail: false, notifySms: true },
      ],
      skipDuplicates: true,
    });
    expect(result.count).toBe(2);
  });
});

describe("removeMemberFromGroup", () => {
  it("removes member by composite key", async () => {
    mockPrisma.contactGroupMember.delete.mockResolvedValue(memberAlice as never);

    await removeMemberFromGroup(1, 10);

    expect(mockPrisma.contactGroupMember.delete).toHaveBeenCalledWith({
      where: { groupId_memberId: { groupId: 1, memberId: 10 } },
    });
  });
});

describe("updateMemberNotifications", () => {
  it("updates notification preferences", async () => {
    const prefs = { notifyEmail: false, notifySms: true };
    mockPrisma.contactGroupMember.update.mockResolvedValue({ ...memberAlice, ...prefs } as never);

    await updateMemberNotifications(1, 10, prefs);

    expect(mockPrisma.contactGroupMember.update).toHaveBeenCalledWith({
      where: { groupId_memberId: { groupId: 1, memberId: 10 } },
      data: prefs,
    });
  });
});

describe("getGroupMembers", () => {
  it("returns all member ids regardless of notification preferences", async () => {
    mockPrisma.contactGroupMember.findMany.mockResolvedValue([
      { memberId: 10 },
      { memberId: 20 },
      { memberId: 30 },
    ] as never);

    const result = await getGroupMembers(1);

    expect(result).toEqual([10, 20, 30]);
    expect(mockPrisma.contactGroupMember.findMany).toHaveBeenCalledWith({
      where: { groupId: 1 },
      select: { memberId: true },
    });
  });
});

describe("getGroupRecipients", () => {
  it("filters by email channel and excludes globally opted-out members", async () => {
    mockPrisma.contactGroupMember.findMany.mockResolvedValue([{ memberId: 10 }, { memberId: 20 }] as never);
    mockPrisma.userPreference.findMany.mockResolvedValue([{ memberId: 20 }] as never);

    const result = await getGroupRecipients(1, "email");

    expect(result).toEqual([10]);
  });

  it("returns all email recipients when none are globally opted out", async () => {
    mockPrisma.contactGroupMember.findMany.mockResolvedValue([{ memberId: 10 }, { memberId: 20 }] as never);
    mockPrisma.userPreference.findMany.mockResolvedValue([] as never);

    const result = await getGroupRecipients(1, "email");

    expect(result).toEqual([10, 20]);
  });

  it("does not check global preference for sms channel", async () => {
    mockPrisma.contactGroupMember.findMany.mockResolvedValue([{ memberId: 20 }] as never);

    const result = await getGroupRecipients(1, "sms");

    expect(result).toEqual([20]);
    expect(mockPrisma.userPreference.findMany).not.toHaveBeenCalled();
  });
});
