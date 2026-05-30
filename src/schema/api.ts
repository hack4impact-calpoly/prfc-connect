import { z } from "zod";
import { ReferralSchema, ProspectSchema } from "./referral";

export const ReferralFormSchema = z.object({
  memberName: z.string().min(1).max(255),
  memberEmail: z.string().max(255).pipe(z.email()),
  referralCode: z.string().min(1).max(100),
  signature: z
    .string()
    .length(8)
    .regex(/^[0-9a-f]+$/i),
  prospects: z.array(ProspectSchema).min(1).max(5),
});

export const UpdateRedeemedSchema = z.object({
  redeemed: z.boolean(),
});

export const ReferralExportQuerySchema = z.object({
  ids: z.preprocess((val) => {
    if (typeof val !== "string" || val.length === 0) return undefined;
    const parts = val
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    return parts.map((part) => Number(part));
  }, z.array(z.number().int().positive()).min(1).max(1000)),
});

export const ApiReferralSchema = ReferralSchema.extend({
  createdAt: z.coerce.date(),
});

export type ReferralForm = z.infer<typeof ReferralFormSchema>;
export type UpdateRedeemed = z.infer<typeof UpdateRedeemedSchema>;
export type ReferralExportQuery = z.infer<typeof ReferralExportQuerySchema>;
export type ApiReferral = z.infer<typeof ApiReferralSchema>;
