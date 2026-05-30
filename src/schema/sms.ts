import { z } from "zod";

export const TwilioInboundSchema = z.object({
  From: z.string().min(1),
  Body: z.string().max(1600),
});

export type TwilioInbound = z.infer<typeof TwilioInboundSchema>;
