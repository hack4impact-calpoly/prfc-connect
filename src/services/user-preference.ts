import "server-only";
import { put, del } from "@vercel/blob";
import prisma from "@/lib/db";
import { AppError, transformError } from "@/utils/errors";

export interface UserPreferenceData {
  notifyEmailDefault: boolean;
  notifySmsDefault: boolean;
}

const DEFAULTS: UserPreferenceData = {
  notifyEmailDefault: true,
  notifySmsDefault: false,
};

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);

export async function getUserPreferences(memberId: number): Promise<UserPreferenceData> {
  try {
    const prefs = await prisma.userPreference.findUnique({
      where: { memberId },
      select: { notifyEmailDefault: true, notifySmsDefault: true },
    });

    return prefs ?? DEFAULTS;
  } catch (error) {
    throw transformError(error);
  }
}

export async function updateUserPreferences(
  memberId: number,
  data: Partial<UserPreferenceData>,
): Promise<UserPreferenceData> {
  try {
    const updated = await prisma.userPreference.upsert({
      where: { memberId },
      create: {
        memberId,
        notifyEmailDefault: data.notifyEmailDefault ?? DEFAULTS.notifyEmailDefault,
        notifySmsDefault: data.notifySmsDefault ?? DEFAULTS.notifySmsDefault,
      },
      update: data,
      select: { notifyEmailDefault: true, notifySmsDefault: true },
    });

    return updated;
  } catch (error) {
    throw transformError(error);
  }
}

export async function uploadProfilePhoto(memberId: number, file: File): Promise<string> {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new AppError("VALIDATION_ERROR", "Profile photo must be JPG or PNG");
  }
  if (file.size === 0) {
    throw new AppError("VALIDATION_ERROR", "Profile photo file is empty");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new AppError("VALIDATION_ERROR", "Profile photo must be 2MB or smaller");
  }
  try {
    const existing = await prisma.userPreference.findUnique({
      where: { memberId },
      select: { photoUrl: true },
    });
    if (existing?.photoUrl) {
      try {
        await del(existing.photoUrl);
      } catch {
        // Swallow not-found so a manually-deleted blob does not block re-upload.
      }
    }
    const ext = file.type === "image/png" ? "png" : "jpg";
    const blob = await put(`avatars/${memberId}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await prisma.userPreference.upsert({
      where: { memberId },
      create: { memberId, photoUrl: blob.url },
      update: { photoUrl: blob.url },
      select: { photoUrl: true },
    });
    return blob.url;
  } catch (error) {
    throw transformError(error);
  }
}

export async function getProfilePhotoUrl(memberId: number): Promise<string | null> {
  try {
    const row = await prisma.userPreference.findUnique({
      where: { memberId },
      select: { photoUrl: true },
    });
    return row?.photoUrl ?? null;
  } catch (error) {
    throw transformError(error);
  }
}

export async function deleteProfilePhoto(memberId: number): Promise<void> {
  try {
    const existing = await prisma.userPreference.findUnique({
      where: { memberId },
      select: { photoUrl: true },
    });
    if (!existing?.photoUrl) return;
    try {
      await del(existing.photoUrl);
    } catch {
      // Swallow not-found.
    }
    await prisma.userPreference.update({
      where: { memberId },
      data: { photoUrl: null },
    });
  } catch (error) {
    throw transformError(error);
  }
}
