import { vi } from "vitest";

vi.mock("@/lib/api/member-api", () => ({
  getMemberDetails: vi.fn(),
  getAllActiveMemberIds: vi.fn(),
  getAllMembers: vi.fn(),
  getMemberById: vi.fn(),
}));

import { getMemberDetails, getAllActiveMemberIds, getAllMembers, getMemberById } from "@/lib/api/member-api";

export const mockGetMemberDetails = vi.mocked(getMemberDetails);
export const mockGetAllActiveMemberIds = vi.mocked(getAllActiveMemberIds);
export const mockGetAllMembers = vi.mocked(getAllMembers);
export const mockGetMemberById = vi.mocked(getMemberById);
