import { z } from "zod";

export const UpdatePreferencesSchema = z
  .object({
    notifyEmailDefault: z.boolean().optional(),
    notifySmsDefault: z.boolean().optional(),
  })
  .refine((data) => data.notifyEmailDefault !== undefined || data.notifySmsDefault !== undefined, {
    message: "At least one notification preference must be provided",
  });

export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
