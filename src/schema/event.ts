import { z } from "zod";

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullish(),
  location: z.string().max(200).nullish(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rsvpDeadline: z.coerce.date().nullish(),
  eventType: z.enum(["social", "networking", "volunteer", "meeting"]),
  groupId: z.number().int().positive().nullish(),
  memberIds: z.array(z.number().int().positive()).optional(),
  groupIds: z.array(z.number().int().positive()).optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const RsvpSchema = z.object({
  eventId: z.number().int().positive(),
  status: z.enum(["going", "maybe", "declined"]),
});

export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
export type Rsvp = z.infer<typeof RsvpSchema>;
