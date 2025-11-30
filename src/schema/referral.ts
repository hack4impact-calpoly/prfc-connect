import { z } from "zod";

export const ReferralSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.date(),
  memberName: z.string().min(1).max(255),
  memberEmail: z.string().email().max(255),
  prospectName: z.string().min(1).max(255),
  prospectEmail: z.string().email().max(255),
  referralCode: z.string().min(1).max(100),
  redeemed: z.boolean(),
});

export const CreateReferralSchema = ReferralSchema.omit({
  id: true,
  createdAt: true,
}).extend({
  redeemed: z.boolean().default(false),
});

export const ProspectSchema = z.object({
  prospectName: z.string().min(1).max(255),
  prospectEmail: z.string().email().max(255),
});

export const ReferralFormSchema = z.object({
  memberName: z.string().min(1).max(255),
  memberEmail: z.string().email().max(255),
  referralCode: z.string().min(1).max(100),
  prospects: z.array(ProspectSchema).min(1).max(5),
});

export const UpdateRedeemedSchema = z.object({
  redeemed: z.boolean(),
});

export const ChecksumSchema = z.object({
  nm: z.string().min(1).max(255),
  em: z.string().email().max(255),
  ref: z.string().min(1).max(100),
  cs: z.string().min(1),
});

export type Referral = z.infer<typeof ReferralSchema>;
export type CreateReferral = z.infer<typeof CreateReferralSchema>;
export type Prospect = z.infer<typeof ProspectSchema>;
export type ReferralForm = z.infer<typeof ReferralFormSchema>;
export type UpdateRedeemed = z.infer<typeof UpdateRedeemedSchema>;
export type ChecksumInput = z.infer<typeof ChecksumSchema>;
