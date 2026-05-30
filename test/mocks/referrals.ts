import type { Referral, CreateReferral } from "@/schema/referral";

export const memberCharlie = {
  name: "Charlie Brown",
  email: "charlie.brown@gmail.com",
};

export const prospectLucy = {
  name: "Lucy Van Pelt",
  email: "lucy.vanpelt@yahoo.com",
};

export const referralCharlie: Referral = {
  id: 1,
  createdAt: new Date("2024-03-15T14:32:17Z"),
  updatedAt: new Date("2024-03-15T14:32:17Z"),
  memberName: memberCharlie.name,
  memberEmail: memberCharlie.email,
  prospectName: prospectLucy.name,
  prospectEmail: prospectLucy.email,
  referralCode: "REF001",
  redeemed: false,
};

export const referralLinusRedeemed: Referral = {
  id: 2,
  createdAt: new Date("2024-03-14T09:15:42Z"),
  updatedAt: new Date("2024-03-16T11:23:08Z"),
  memberName: "Linus Van Pelt",
  memberEmail: "linus.vanpelt@outlook.com",
  prospectName: "Sally Brown",
  prospectEmail: "sally.brown@icloud.com",
  referralCode: "REF002",
  redeemed: true,
};

export const referralSchroeder: Referral = {
  id: 3,
  createdAt: new Date("2024-03-13T16:45:03Z"),
  updatedAt: new Date("2024-03-13T16:45:03Z"),
  memberName: "Schroeder Piano",
  memberEmail: "schroeder@hotmail.com",
  prospectName: "Peppermint Patty",
  prospectEmail: "peppermint.patty@gmail.com",
  referralCode: "REF003",
  redeemed: false,
};

export const allReferrals: Referral[] = [referralCharlie, referralLinusRedeemed, referralSchroeder];

export const createReferralInput: CreateReferral = {
  memberName: memberCharlie.name,
  memberEmail: memberCharlie.email,
  prospectName: prospectLucy.name,
  prospectEmail: prospectLucy.email,
  referralCode: "REF001",
  redeemed: false,
};

export const formWithTwoProspects = {
  memberName: memberCharlie.name,
  memberEmail: memberCharlie.email,
  referralCode: "REF001",
  signature: "abcd1234",
  prospects: [
    { prospectName: prospectLucy.name, prospectEmail: prospectLucy.email },
    { prospectName: "Marcie Johnson", prospectEmail: "marcie.johnson@yahoo.com" },
  ],
};
