import { z } from "zod";

export const ReferralSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  memberName: z.string().min(1).max(255),
  memberEmail: z.string().max(255).pipe(z.email()),
  prospectName: z.string().min(1).max(255),
  prospectEmail: z.string().max(255).pipe(z.email()),
  referralCode: z.string().min(1).max(100),
  redeemed: z.boolean(),
});

export const CreateReferralSchema = ReferralSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  redeemed: z.boolean().default(false),
});

export const ProspectSchema = z.object({
  prospectName: z.string().min(1).max(255),
  prospectEmail: z.string().max(255).pipe(z.email()),
});

export type Referral = z.infer<typeof ReferralSchema>;
export type CreateReferral = z.infer<typeof CreateReferralSchema>;
export type Prospect = z.infer<typeof ProspectSchema>;
