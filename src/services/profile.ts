import "server-only";
import { getMemberById } from "@/lib/api/member-api";
import { splitName } from "@/utils/name";
import { AppError } from "@/utils/errors";

import type { MemberProfile } from "@/types/settings";

export type { MemberProfile } from "@/types/settings";

export async function getMemberProfile(ownerid: number, isAdmin: boolean): Promise<MemberProfile> {
  const member = await getMemberById(ownerid);

  if (!member) {
    throw new AppError("NOT_FOUND", "Member not found");
  }

  const { firstName, lastName } = splitName(member.ownername);

  return {
    firstName,
    lastName,
    email: member.owneremail,
    phone: member.ownerphone,
    altPhone: member.owneraltphone,
    role: isAdmin ? "Admin" : "Member",
  };
}
