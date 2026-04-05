import { z } from "zod";

export const ContactGroupSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  ownerid: z.number().int().positive(),
});

export const CreateContactGroupSchema = ContactGroupSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ownerid: true,
}).extend({
  description: z.string().max(500).nullish(),
});

export const UpdateContactGroupSchema = CreateContactGroupSchema.partial();

export const GroupMemberSchema = z.object({
  memberId: z.number().int().positive(),
  notifyEmail: z.boolean().default(true),
  notifySms: z.boolean().default(false),
});

export const AddMembersSchema = z.object({
  groupId: z.number().int().positive(),
  members: z.array(GroupMemberSchema).min(1),
});

export const UpdateNotificationSchema = z
  .object({
    groupId: z.number().int().positive(),
    memberId: z.number().int().positive(),
    notifyEmail: z.boolean().optional(),
    notifySms: z.boolean().optional(),
  })
  .refine((data) => data.notifyEmail !== undefined || data.notifySms !== undefined, {
    message: "At least one notification preference must be provided",
  });

export const BaseMessageSchema = z
  .object({
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
    sendEmail: z.boolean().default(true),
    sendSms: z.boolean().default(false),
  })
  .refine((data) => !data.sendSms || data.body.length <= 160, {
    message: "SMS messages must be 160 characters or fewer",
    path: ["body"],
  });

export const ComposeMessageSchema = BaseMessageSchema.extend({
  groupId: z.number().int().positive(),
});

export const BlastMessageSchema = BaseMessageSchema.extend({
  confirmationText: z.literal("SEND TO ALL"),
});

export type ContactGroup = z.infer<typeof ContactGroupSchema>;
export type CreateContactGroup = z.infer<typeof CreateContactGroupSchema>;
export type UpdateContactGroup = z.infer<typeof UpdateContactGroupSchema>;
export type GroupMember = z.infer<typeof GroupMemberSchema>;
export type AddMembers = z.infer<typeof AddMembersSchema>;
export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;
export type ComposeMessage = z.infer<typeof ComposeMessageSchema>;
export type BlastMessage = z.infer<typeof BlastMessageSchema>;
