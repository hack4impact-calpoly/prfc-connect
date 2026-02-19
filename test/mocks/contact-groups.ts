import type { ContactGroup, ContactGroupMember } from "@/generated/prisma/client";

export const groupAlpha: ContactGroup = {
  id: 1,
  createdAt: new Date("2024-06-01T10:00:00Z"),
  updatedAt: new Date("2024-06-01T10:00:00Z"),
  name: "Alpha Group",
  description: "First test group",
  ownerid: 100,
};

export const groupBravo: ContactGroup = {
  id: 2,
  createdAt: new Date("2024-06-02T12:00:00Z"),
  updatedAt: new Date("2024-06-02T12:00:00Z"),
  name: "Bravo Group",
  description: "Second test group",
  ownerid: 100,
};

export const groupCharlie: ContactGroup = {
  id: 3,
  createdAt: new Date("2024-06-03T08:00:00Z"),
  updatedAt: new Date("2024-06-03T08:00:00Z"),
  name: "Charlie Group",
  description: null,
  ownerid: 200,
};

export const allGroups: ContactGroup[] = [groupAlpha, groupBravo, groupCharlie];

export const memberAlice: ContactGroupMember = {
  id: 1,
  groupId: 1,
  memberId: 10,
  notifyEmail: true,
  notifySms: false,
  addedAt: new Date("2024-06-05T09:00:00Z"),
  addedBy: 100,
  unsubscribedAt: null,
  unsubscribeMethod: null,
};

export const memberBob: ContactGroupMember = {
  id: 2,
  groupId: 1,
  memberId: 20,
  notifyEmail: false,
  notifySms: true,
  addedAt: new Date("2024-06-05T10:00:00Z"),
  addedBy: 100,
  unsubscribedAt: null,
  unsubscribeMethod: null,
};
