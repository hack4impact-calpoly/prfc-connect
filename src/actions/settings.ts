"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { UpdatePreferencesSchema } from "@/schema/settings";
import { grantSmsConsent, revokeSmsConsent } from "@/services/sms-consent";
import { getMemberProfile } from "@/services/profile";
import { updateUserPreferences, uploadProfilePhoto } from "@/services/user-preference";
import { transformError } from "@/utils/errors";
import type { ActionResult } from "@/types/action";
import type { UserPreferenceData } from "@/services/user-preference";

export async function updateUserPreferencesAction(input: {
  notifyEmailDefault?: boolean;
  notifySmsDefault?: boolean;
}): Promise<ActionResult<UserPreferenceData>> {
  try {
    const session = await verifySession();
    const validated = UpdatePreferencesSchema.parse(input);
    const updated = await updateUserPreferences(session.ownerid, validated);

    if (validated.notifySmsDefault === true) {
      const profile = await getMemberProfile(session.ownerid, session.isAdmin);
      await grantSmsConsent(session.ownerid, profile.phone);
    } else if (validated.notifySmsDefault === false) {
      await revokeSmsConsent(session.ownerid, "web_settings_toggle", null);
    }

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
    revalidatePath("/profile");
    revalidatePath("/settings");
    return { success: true, data: { url } };
  } catch (error) {
    const appError = transformError(error);
    return { success: false, error: appError.message };
  }
}
