import "server-only";
import { cache } from "react";
import { env } from "@/env";
import { AppError } from "@/utils/errors";
import { fetchListMembers, fetchMemberContacts, getPortalToken } from "@/lib/api/portal-api";
import type { Member, MemberSummary } from "@/types/member";
export type { MemberSummary } from "@/types/member";

async function getMockMemberDetails(memberIds: number[]): Promise<Member[]> {
  const { findMemberById } = await import("@/lib/mock-members");
  return memberIds.map((id) => findMemberById(id)).filter((m): m is Member => m !== undefined);
}

async function getRealMemberDetails(memberIds: number[]): Promise<Member[]> {
  return fetchMemberContacts(memberIds);
}

async function getMockAllActiveMemberIds(): Promise<number[]> {
  const { mockMembers } = await import("@/lib/mock-members");
  return mockMembers.map((m) => m.ownerid);
}

async function getRealAllActiveMemberIds(): Promise<number[]> {
  const token = await getPortalToken();
  if (!token) throw new AppError("UNAUTHORIZED", "Member portal session required");
  const members = await fetchListMembers(token);
  return members.map((m) => m.ownerid);
}

async function getMockAllMembers(): Promise<MemberSummary[]> {
  const { mockMembers } = await import("@/lib/mock-members");
  return mockMembers.map(({ ownerid, ownername }) => ({ ownerid, ownername }));
}

async function getRealAllMembers(): Promise<MemberSummary[]> {
  const token = await getPortalToken();
  if (!token) throw new AppError("UNAUTHORIZED", "Member portal session required");
  return fetchListMembers(token);
}

async function getMockMemberById(id: number): Promise<Member | null> {
  const { findMemberById } = await import("@/lib/mock-members");
  return findMemberById(id) ?? null;
}

async function getRealMemberById(id: number): Promise<Member | null> {
  const members = await fetchMemberContacts([id]);
  return members[0] ?? null;
}

export async function getMemberDetails(memberIds: number[]): Promise<Member[]> {
  if (env.USE_MOCK_MEMBER_API) {
    return getMockMemberDetails(memberIds);
  }
  return getRealMemberDetails(memberIds);
}

export const getAllActiveMemberIds = cache(async (): Promise<number[]> => {
  if (env.USE_MOCK_MEMBER_API) {
    return getMockAllActiveMemberIds();
  }
  return getRealAllActiveMemberIds();
});

export const getAllMembers = cache(async (): Promise<MemberSummary[]> => {
  if (env.USE_MOCK_MEMBER_API) {
    return getMockAllMembers();
  }
  return getRealAllMembers();
});

export const getMemberById = cache(async (id: number): Promise<Member | null> => {
  if (env.USE_MOCK_MEMBER_API) {
    return getMockMemberById(id);
  }
  return getRealMemberById(id);
});
