import { z } from "zod";

export const MessageHistoryQuerySchema = z.object({
  search: z.string().max(200).optional(),
  channel: z.enum(["email", "sms"]).optional(),
  sort: z.enum(["recent", "oldest"]).optional(),
  cursor: z.number().int().positive().optional(),
  direction: z.enum(["forward", "backward"]).optional(),
  pageSize: z.union([z.literal(10), z.literal(25), z.literal(50)]).optional(),
});

export type MessageHistoryQueryInput = z.infer<typeof MessageHistoryQuerySchema>;
