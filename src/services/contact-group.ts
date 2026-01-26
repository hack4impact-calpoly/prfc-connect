import "server-only";
import prisma from "@/lib/db";
import { AppError, transformError } from "@/utils/errors";
import type { ContactGroup, ContactGroupMember } from "@/generated/prisma/client";
import type { CreateContactGroup, UpdateContactGroup, GroupMember, UpdateNotification } from "@/schema/contact-group";

type NotificationPreferences = Pick<UpdateNotification, "notifyEmail" | "notifySms">;

export interface GroupWithCount extends ContactGroup {
  memberCount: number;
}

export interface GroupWithMembers extends ContactGroup {
  members: ContactGroupMember[];
  memberCount: number;
}

export async function getGroupsByOwner(ownerid: number): Promise<GroupWithCount[]> {
  try {
    const groups = await prisma.contactGroup.findMany({
      where: { ownerid },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return groups.map((g) => ({
      ...g,
      memberCount: g._count.members,
    }));
  } catch (error) {
    throw transformError(error);
  }
}

export async function getAllGroups(): Promise<GroupWithCount[]> {
  try {
    const groups = await prisma.contactGroup.findMany({
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return groups.map((g) => ({
      ...g,
      memberCount: g._count.members,
    }));
  } catch (error) {
    throw transformError(error);
  }
}

export async function getGroupById(id: number): Promise<GroupWithMembers> {
  try {
    const group = await prisma.contactGroup.findUnique({
      where: { id },
      include: {
        members: true,
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      throw new AppError("NOT_FOUND", `Group with id ${id} not found`);
    }

    return {
      ...group,
      memberCount: group._count.members,
    };
  } catch (error) {
    throw transformError(error);
  }
}

export async function isGroupOwner(groupId: number, ownerid: number): Promise<boolean> {
  try {
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, ownerid },
      select: { id: true },
    });
    return group !== null;
  } catch (error) {
    throw transformError(error);
  }
}

export async function createGroup(data: CreateContactGroup, ownerid: number): Promise<ContactGroup> {
  try {
    return await prisma.contactGroup.create({
      data: {
        name: data.name,
        description: data.description,
        ownerid,
      },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function updateGroup(id: number, data: UpdateContactGroup): Promise<ContactGroup> {
  try {
    return await prisma.contactGroup.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function deleteGroup(id: number): Promise<void> {
  try {
    await prisma.contactGroup.delete({
      where: { id },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function addMemberToGroup(
  groupId: number,
  memberId: number,
  addedBy: number,
  preferences: NotificationPreferences = {},
): Promise<ContactGroupMember> {
  try {
    return await prisma.contactGroupMember.create({
      data: {
        groupId,
        memberId,
        addedBy,
        notifyEmail: preferences.notifyEmail ?? true,
        notifySms: preferences.notifySms ?? false,
      },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function addMembersToGroup(
  groupId: number,
  members: GroupMember[],
  addedBy: number,
): Promise<{ count: number }> {
  try {
    return await prisma.contactGroupMember.createMany({
      data: members.map((m) => ({
        groupId,
        memberId: m.memberId,
        addedBy,
        notifyEmail: m.notifyEmail,
        notifySms: m.notifySms,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function removeMemberFromGroup(groupId: number, memberId: number): Promise<void> {
  try {
    await prisma.contactGroupMember.delete({
      where: {
        groupId_memberId: { groupId, memberId },
      },
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function updateMemberNotifications(
  groupId: number,
  memberId: number,
  preferences: NotificationPreferences,
): Promise<ContactGroupMember> {
  try {
    return await prisma.contactGroupMember.update({
      where: {
        groupId_memberId: { groupId, memberId },
      },
      data: preferences,
    });
  } catch (error) {
    throw transformError(error);
  }
}

export async function getGroupRecipients(groupId: number, channel: "email" | "sms"): Promise<number[]> {
  try {
    const members = await prisma.contactGroupMember.findMany({
      where: {
        groupId,
        ...(channel === "email" ? { notifyEmail: true } : { notifySms: true }),
      },
      select: { memberId: true },
    });
    return members.map((m) => m.memberId);
  } catch (error) {
    throw transformError(error);
  }
}
