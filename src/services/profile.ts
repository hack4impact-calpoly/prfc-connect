import "server-only";
import { getMemberById } from "@/lib/api/member-api";
import { splitName } from "@/utils/name";
import { AppError } from "@/utils/errors";

export interface MemberProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string | undefined;
  role: "Admin" | "Member";
}

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
