import { z } from "zod";

const EventFieldsSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullish(),
  location: z.string().max(200).nullish(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isAllDay: z.boolean().optional().default(false),
  rsvpDeadline: z.coerce.date().nullish(),
  eventType: z.enum(["social", "networking", "volunteer", "meeting"]),
  groupId: z.number().int().positive().nullish(),
  memberIds: z.array(z.number().int().positive()).optional(),
  groupIds: z.array(z.number().int().positive()).optional(),
});

export const CreateEventSchema = EventFieldsSchema.refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const UpdateEventSchema = EventFieldsSchema.partial().refine(
  (data) => {
    if (data.startDate && data.endDate) return data.endDate >= data.startDate;
    return true;
  },
  { message: "End date must be after start date", path: ["endDate"] },
);

export const RsvpSchema = z.object({
  eventId: z.number().int().positive(),
  status: z.enum(["going", "maybe", "declined"]),
});

export const EventIdSchema = z.number().int().positive();

export const WeekStartSchema = z.coerce.date();

export const FetchEventsForMonthSchema = z.object({
  year: z.number().int().min(1970).max(9999),
  month: z.number().int().min(1).max(12),
  filters: z
    .object({
      eventType: z.enum(["social", "networking", "volunteer", "meeting"]).optional(),
      groupId: z.number().int().positive().optional(),
      inviteeMemberId: z.number().int().positive().optional(),
    })
    .optional(),
});

export const EventSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isAllDay: z.boolean(),
  eventType: z.enum(["social", "networking", "volunteer", "meeting"]),
  location: z.string().nullable(),
  groupName: z.string().nullable(),
  rsvpCount: z.number(),
});

export const EventWithRsvpCountSchema = z.object({
  id: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isAllDay: z.boolean(),
  rsvpDeadline: z.coerce.date().nullable(),
  eventType: z.enum(["social", "networking", "volunteer", "meeting"]),
  ownerid: z.number(),
  groupId: z.number().nullable(),
  rsvpCount: z.number(),
});

export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
export type Rsvp = z.infer<typeof RsvpSchema>;
