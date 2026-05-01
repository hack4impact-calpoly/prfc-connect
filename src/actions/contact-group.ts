"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  CreateContactGroupSchema,
  UpdateContactGroupSchema,
  AddMembersSchema,
  UpdateNotificationSchema,
  ComposeMessageSchema,
  BlastMessageSchema,
} from "@/schema/contact-group";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  isGroupOwner,
  getGroupById,
  enrichGroupMembers,
  addMembersToGroup,
  removeMemberFromGroup,
  removeMembersFromGroup,
  updateMemberNotifications,
} from "@/services/contact-group";
import {
  sendGroupMessage,
  sendBlastMessage,
  getMessageHistoryPage,
  getMessageById,
  getMessageRecipients,
  previewRecipientCounts,
} from "@/services/message";
import { MessageHistoryQuerySchema } from "@/schema/message";
import { getMemberById } from "@/lib/api/member-api";
import { transformError } from "@/utils/errors";
import type { ActionResult } from "@/types/action";
import type { MessageHistoryQueryInput } from "@/schema/message";
import type {
  MessageResult,
  MessageHistoryPage,
  MessageDetail,
  RecipientStatus,
  RecipientCounts,
} from "@/services/message";
import type { EnrichedGroupData } from "@/types/group";
export type { EnrichedGroupData } from "@/types/group";

export async function fetchEnrichedGroup(groupId: number): Promise<ActionResult<EnrichedGroupData>> {
  try {
    const session = await verifySession();

    if (!session.isAdmin && !(await isGroupOwner(groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to view this group" };
    }

    const group = await getGroupById(groupId);
    const [enriched, owner] = await Promise.all([enrichGroupMembers(group), getMemberById(group.ownerid)]);

    return {
      success: true,
      data: {
        id: enriched.id,
        name: enriched.name,
        description: enriched.description,
        members: enriched.members.map((m) => ({
          memberId: m.memberId,
          ownername: m.ownername,
        })),
        memberCount: enriched.memberCount,
        ownerName: owner?.ownername ?? null,
      },
    };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function createContactGroup(input: {
  name: string;
  description: string | null;
  memberIds?: number[];
}): Promise<ActionResult<{ id: number }>> {
  try {
    const session = await verifySession();

    const validated = CreateContactGroupSchema.parse(input);
    const { memberIds, ...groupData } = validated;

    const group = await createGroup(groupData, session.ownerid);

    if (memberIds && memberIds.length > 0) {
      await addMembersToGroup(
        group.id,
        memberIds.map((id) => ({ memberId: id, notifyEmail: true, notifySms: false })),
        session.ownerid,
      );
    }

    revalidatePath("/groups");
    return { success: true, data: { id: group.id } };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function updateContactGroup(groupId: number, formData: FormData): Promise<ActionResult> {
  try {
    const session = await verifySession();

    if (!session.isAdmin && !(await isGroupOwner(groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to edit this group" };
    }

    const validated = UpdateContactGroupSchema.parse({
      name: formData.get("name") || undefined,
      description: formData.get("description") || null,
    });

    await updateGroup(groupId, validated);

    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/groups");
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function deleteContactGroup(groupId: number): Promise<ActionResult> {
  try {
    const session = await verifySession();

    if (!session.isAdmin && !(await isGroupOwner(groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to delete this group" };
    }

    await deleteGroup(groupId);

    revalidatePath("/groups");
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function addMembers(input: {
  groupId: number;
  members: Array<{ memberId: number; notifyEmail?: boolean; notifySms?: boolean }>;
}): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await verifySession();
    const validated = AddMembersSchema.parse(input);

    if (!session.isAdmin && !(await isGroupOwner(validated.groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to add members to this group" };
    }

    const result = await addMembersToGroup(validated.groupId, validated.members, session.ownerid);

    revalidatePath(`/groups/${validated.groupId}`);
    return { success: true, data: result };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function removeMember(groupId: number, memberId: number): Promise<ActionResult> {
  try {
    const session = await verifySession();

    if (!session.isAdmin && !(await isGroupOwner(groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to remove members from this group" };
    }

    await removeMemberFromGroup(groupId, memberId);

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function leaveGroup(groupId: number): Promise<ActionResult> {
  try {
    const session = await verifySession();
    await removeMemberFromGroup(groupId, session.ownerid);

    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/groups");
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function removeMembers(groupId: number, memberIds: number[]): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await verifySession();

    if (!session.isAdmin && !(await isGroupOwner(groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to remove members from this group" };
    }

    const result = await removeMembersFromGroup(groupId, memberIds);

    revalidatePath(`/groups/${groupId}`);
    return { success: true, data: result };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function updateNotifications(input: {
  groupId: number;
  memberId: number;
  notifyEmail?: boolean;
  notifySms?: boolean;
}): Promise<ActionResult> {
  try {
    const session = await verifySession();
    const validated = UpdateNotificationSchema.parse(input);

    if (!session.isAdmin && !(await isGroupOwner(validated.groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to update notification preferences" };
    }

    await updateMemberNotifications(validated.groupId, validated.memberId, {
      notifyEmail: validated.notifyEmail,
      notifySms: validated.notifySms,
    });

    revalidatePath(`/groups/${validated.groupId}`);
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function sendMessage(input: {
  groupIds: number[];
  subject: string;
  body: string;
  smsBody?: string;
  sendEmail?: boolean;
  sendSms?: boolean;
}): Promise<ActionResult<MessageResult>> {
  try {
    const session = await verifySession();
    const validated = ComposeMessageSchema.parse(input);

    if (!session.isAdmin) {
      const ownerChecks = await Promise.all(validated.groupIds.map((gid) => isGroupOwner(gid, session.ownerid)));
      if (ownerChecks.some((isOwner) => !isOwner)) {
        return { success: false, error: "You do not have permission to send messages to one or more selected groups" };
      }
    }

    const result = await sendGroupMessage(validated, session.ownerid);

    return { success: true, data: result };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function sendBlast(input: {
  subject: string;
  body: string;
  smsBody?: string;
  sendEmail?: boolean;
  sendSms?: boolean;
  confirmationText: "SEND TO ALL";
}): Promise<ActionResult<MessageResult>> {
  try {
    const session = await verifySession();
    const validated = BlastMessageSchema.parse(input);

    if (!session.isAdmin) {
      return { success: false, error: "You do not have permission to send blast messages" };
    }

    const result = await sendBlastMessage(validated, session.ownerid);

    return { success: true, data: result };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchMessageHistoryPage(
  input: MessageHistoryQueryInput,
): Promise<ActionResult<MessageHistoryPage>> {
  try {
    const session = await verifySession();
    const validated = MessageHistoryQuerySchema.parse(input);
    const roleFilter = session.isAdmin ? {} : { recipientId: session.ownerid };
    const page = await getMessageHistoryPage({ ...validated, ...roleFilter });
    return { success: true, data: page };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchMessageDetail(messageId: number): Promise<
  ActionResult<{
    message: MessageDetail;
    recipients: RecipientStatus[];
  }>
> {
  try {
    const session = await verifySession();
    const message = await getMessageById(messageId);

    if (!session.isAdmin && message.senderId !== session.ownerid) {
      return { success: false, error: "You do not have permission to view this message" };
    }

    const recipients = await getMessageRecipients(messageId);
    return { success: true, data: { message, recipients } };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchRecipientPreview(groupId: number): Promise<ActionResult<RecipientCounts>> {
  try {
    const session = await verifySession();

    if (!session.isAdmin && !(await isGroupOwner(groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to preview recipients for this group" };
    }

    const counts = await previewRecipientCounts(groupId);
    return { success: true, data: counts };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}
