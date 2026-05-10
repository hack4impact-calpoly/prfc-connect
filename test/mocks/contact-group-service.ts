import { vi } from "vitest";

vi.mock("@/services/contact-group", () => ({
  getGroupsByOwner: vi.fn(),
  getAllGroups: vi.fn(),
  getAllGroupsWithMemberIds: vi.fn(),
  getGroupsWithMemberIdsByOwner: vi.fn(),
  getGroupById: vi.fn(),
  isGroupOwner: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  addMemberToGroup: vi.fn(),
  addMembersToGroup: vi.fn(),
  removeMemberFromGroup: vi.fn(),
  removeMembersFromGroup: vi.fn(),
  updateMemberNotifications: vi.fn(),
  getGroupMembers: vi.fn(),
  getGroupRecipients: vi.fn(),
  enrichGroupMembers: vi.fn(),
}));

import {
  getGroupsByOwner,
  getAllGroups,
  getAllGroupsWithMemberIds,
  getGroupsWithMemberIdsByOwner,
  getGroupById,
  isGroupOwner,
  createGroup,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  addMembersToGroup,
  removeMemberFromGroup,
  removeMembersFromGroup,
  updateMemberNotifications,
  getGroupMembers,
  getGroupRecipients,
  enrichGroupMembers,
} from "@/services/contact-group";

export const mockGetGroupsByOwner = vi.mocked(getGroupsByOwner);
export const mockGetAllGroups = vi.mocked(getAllGroups);
export const mockGetAllGroupsWithMemberIds = vi.mocked(getAllGroupsWithMemberIds);
export const mockGetGroupsWithMemberIdsByOwner = vi.mocked(getGroupsWithMemberIdsByOwner);
export const mockGetGroupById = vi.mocked(getGroupById);
export const mockIsGroupOwner = vi.mocked(isGroupOwner);
export const mockCreateGroup = vi.mocked(createGroup);
export const mockUpdateGroup = vi.mocked(updateGroup);
export const mockDeleteGroup = vi.mocked(deleteGroup);
export const mockAddMemberToGroup = vi.mocked(addMemberToGroup);
export const mockAddMembersToGroup = vi.mocked(addMembersToGroup);
export const mockRemoveMemberFromGroup = vi.mocked(removeMemberFromGroup);
export const mockRemoveMembersFromGroup = vi.mocked(removeMembersFromGroup);
export const mockUpdateMemberNotifications = vi.mocked(updateMemberNotifications);
export const mockGetGroupMembers = vi.mocked(getGroupMembers);
export const mockGetGroupRecipients = vi.mocked(getGroupRecipients);
export const mockEnrichGroupMembers = vi.mocked(enrichGroupMembers);
