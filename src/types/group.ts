import type { ContactGroup, ContactGroupMember } from "@/generated/prisma/client";

export interface GroupWithCount extends ContactGroup {
  memberCount: number;
}

export interface GroupWithMembers extends ContactGroup {
  members: ContactGroupMember[];
  memberCount: number;
}

export interface EnrichedGroupMember extends ContactGroupMember {
  ownername: string;
  owneremail: string;
}

export interface GroupWithEnrichedMembers extends ContactGroup {
  members: EnrichedGroupMember[];
  memberCount: number;
}

export interface GroupWithMemberIds extends ContactGroup {
  memberCount: number;
  memberIds: number[];
}

export interface EnrichedGroupData {
  id: number;
  name: string;
  description: string | null;
  members: Array<{ memberId: number; ownername: string }>;
  memberCount: number;
  ownerName: string | null;
}

export interface MemberRow {
  memberId: number;
  ownername: string;
  photoUrl?: string | null;
  isOwner: boolean;
  isSelected: boolean;
}
