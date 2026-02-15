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
  addMembersToGroup,
  removeMemberFromGroup,
  updateMemberNotifications,
} from "@/services/contact-group";
import { sendGroupMessage, sendBlastMessage } from "@/services/message";
import { transformError } from "@/utils/errors";
import type { ActionResult } from "@/lib/action-types";
import type { MessageResult } from "@/services/message";

export async function createContactGroup(formData: FormData): Promise<ActionResult<{ id: number }>> {
  try {
    const session = await verifySession();

    const validated = CreateContactGroupSchema.parse({
      name: formData.get("name"),
      description: formData.get("description") || null,
    });

    const group = await createGroup(validated, session.ownerid);

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
  groupId: number;
  subject: string;
  body: string;
  sendEmail?: boolean;
  sendSms?: boolean;
}): Promise<ActionResult<MessageResult>> {
  try {
    const session = await verifySession();

    if (!session.isAdmin && !(await isGroupOwner(input.groupId, session.ownerid))) {
      return { success: false, error: "You do not have permission to send messages to this group" };
    }

    const validated = ComposeMessageSchema.parse(input);
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
  sendEmail?: boolean;
  sendSms?: boolean;
  confirmationText: "SEND TO ALL";
}): Promise<ActionResult<MessageResult>> {
  try {
    const session = await verifySession();

    if (!session.isAdmin) {
      return { success: false, error: "You do not have permission to send blast messages" };
    }

    const validated = BlastMessageSchema.parse(input);
    const result = await sendBlastMessage(validated, session.ownerid);

    return { success: true, data: result };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}
