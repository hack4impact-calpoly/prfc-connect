import { z } from "zod";

export const UpdatePreferencesSchema = z
  .object({
    notifyEmailDefault: z.boolean().optional(),
    notifySmsDefault: z.boolean().optional(),
  })
  .refine((data) => data.notifyEmailDefault !== undefined || data.notifySmsDefault !== undefined, {
    message: "At least one notification preference must be provided",
  });

export const RevokeSmsConsentSchema = z.object({
  method: z.string().min(1).max(50),
  message: z.string().max(500).nullable(),
});

export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
export type RevokeSmsConsent = z.infer<typeof RevokeSmsConsentSchema>;
