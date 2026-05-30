import { z } from "zod";

export const AuthCallbackSchema = z.object({
  token: z.string().min(1),
});

export type AuthCallback = z.infer<typeof AuthCallbackSchema>;
