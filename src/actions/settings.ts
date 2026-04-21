"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { UpdatePreferencesSchema, RevokeSmsConsentSchema } from "@/schema/settings";
import { getMemberSmsConsent, revokeSmsConsent } from "@/services/sms-consent";
import { getUserPreferences, updateUserPreferences, uploadProfilePhoto } from "@/services/user-preference";
import { transformError } from "@/utils/errors";
import type { ActionResult } from "@/lib/action-types";
import type { SmsConsentRecord } from "@/services/sms-consent";
import type { UserPreferenceData } from "@/services/user-preference";

export async function fetchSmsConsent(): Promise<ActionResult<SmsConsentRecord | null>> {
  try {
    const session = await verifySession();
    const consent = await getMemberSmsConsent(session.ownerid);
    return { success: true, data: consent };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function revokeSmsConsentAction(input: { method: string; message: string | null }): Promise<ActionResult> {
  try {
    const session = await verifySession();
    const validated = RevokeSmsConsentSchema.parse(input);
    await revokeSmsConsent(session.ownerid, validated.method, validated.message);
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function fetchUserPreferences(): Promise<ActionResult<UserPreferenceData>> {
  try {
    const session = await verifySession();
    const prefs = await getUserPreferences(session.ownerid);
    return { success: true, data: prefs };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function updateUserPreferencesAction(input: {
  notifyEmailDefault?: boolean;
  notifySmsDefault?: boolean;
}): Promise<ActionResult<UserPreferenceData>> {
  try {
    const session = await verifySession();
    const validated = UpdatePreferencesSchema.parse(input);
    const updated = await updateUserPreferences(session.ownerid, validated);
    revalidatePath("/settings");
    return { success: true, data: updated };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}

export async function uploadPhotoAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await verifySession();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "No file provided" };
    }
    const url = await uploadProfilePhoto(session.ownerid, file);
    revalidatePath("/settings");
    return { success: true, data: { url } };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}
