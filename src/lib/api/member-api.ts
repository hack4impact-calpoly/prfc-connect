import "server-only";
import { env } from "@/env";
import { AppError } from "@/utils/errors";
import type { MockMember } from "@/lib/mock-members";
import type { MemberSummary } from "@/types/member";
export type { MemberSummary } from "@/types/member";

async function getMockMemberDetails(memberIds: number[]): Promise<MockMember[]> {
  const { findMemberById } = await import("@/lib/mock-members");
  return memberIds.map((id) => findMemberById(id)).filter((m): m is MockMember => m !== undefined);
}

async function getRealMemberDetails(_memberIds: number[]): Promise<MockMember[]> {
  throw new AppError("INTERNAL_ERROR", "Service temporarily unavailable");
}

async function getMockAllActiveMemberIds(): Promise<number[]> {
  const { mockMembers } = await import("@/lib/mock-members");
  return mockMembers.map((m) => m.ownerid);
}

async function getRealAllActiveMemberIds(): Promise<number[]> {
  throw new AppError("INTERNAL_ERROR", "Service temporarily unavailable");
}

async function getMockAllMembers(): Promise<MemberSummary[]> {
  const { mockMembers } = await import("@/lib/mock-members");
  return mockMembers.map(({ ownerid, ownername }) => ({ ownerid, ownername }));
}

async function getRealAllMembers(): Promise<MemberSummary[]> {
  throw new AppError("INTERNAL_ERROR", "Service temporarily unavailable");
}

async function getMockMemberById(id: number): Promise<MockMember | null> {
  const { findMemberById } = await import("@/lib/mock-members");
  return findMemberById(id) ?? null;
}

async function getRealMemberById(_id: number): Promise<MockMember | null> {
  throw new AppError("INTERNAL_ERROR", "Service temporarily unavailable");
}

export async function getMemberDetails(memberIds: number[]): Promise<MockMember[]> {
  if (env.USE_MOCK_MEMBER_API) {
    return getMockMemberDetails(memberIds);
  }
  return getRealMemberDetails(memberIds);
}

export async function getAllActiveMemberIds(): Promise<number[]> {
  if (env.USE_MOCK_MEMBER_API) {
    return getMockAllActiveMemberIds();
  }
  return getRealAllActiveMemberIds();
}

export async function getAllMembers(): Promise<MemberSummary[]> {
  if (env.USE_MOCK_MEMBER_API) {
    return getMockAllMembers();
  }
  return getRealAllMembers();
}

export async function getMemberById(id: number): Promise<MockMember | null> {
  if (env.USE_MOCK_MEMBER_API) {
    return getMockMemberById(id);
  }
  return getRealMemberById(id);
}
