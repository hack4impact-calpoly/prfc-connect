import { z } from "zod";
import { ReferralSchema, ProspectSchema } from "./referral";

export const ReferralFormSchema = z.object({
  memberName: z.string().min(1).max(255),
  memberEmail: z.string().max(255).pipe(z.email()),
  referralCode: z.string().min(1).max(100),
  prospects: z.array(ProspectSchema).min(1).max(5),
});

export const ChecksumSchema = z.object({
  memberName: z.string().min(1).max(255),
  memberEmail: z.string().max(255).pipe(z.email()),
  referralCode: z.string().min(1).max(100),
  checksum: z.string().min(1),
});

export const UpdateRedeemedSchema = z.object({
  redeemed: z.boolean(),
});

export const ApiReferralSchema = ReferralSchema.extend({
  createdAt: z.coerce.date(),
});

export type ReferralForm = z.infer<typeof ReferralFormSchema>;
export type ChecksumInput = z.infer<typeof ChecksumSchema>;
export type UpdateRedeemed = z.infer<typeof UpdateRedeemedSchema>;
export type ApiReferral = z.infer<typeof ApiReferralSchema>;
