import "server-only";
import { put, del } from "@vercel/blob";
import prisma from "@/lib/db";
import { AppError, transformError } from "@/utils/errors";
import { MAX_PHOTO_BYTES, ALLOWED_PHOTO_TYPES } from "@/utils/photo-constraints";

import type { UserPreferenceData } from "@/types/settings";

export type { UserPreferenceData } from "@/types/settings";

const DEFAULTS: UserPreferenceData = {
  notifyEmailDefault: true,
  notifySmsDefault: false,
};

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

async function verifyImageMagicBytes(file: File): Promise<boolean> {
  const buffer = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (buffer.length < 3) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  return false;
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
  if (!(await verifyImageMagicBytes(file))) {
    throw new AppError("VALIDATION_ERROR", "File content does not match a valid JPG or PNG image");
  }
  try {
    const existing = await prisma.userPreference.findUnique({
      where: { memberId },
      select: { photoUrl: true },
    });
    const ext = file.type === "image/png" ? "png" : "jpg";
    const blob = await put(`avatars/${memberId}.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    if (blob.url.length > 500) {
      try {
        await del(blob.url);
      } catch {
        // Swallow not-found.
      }
      throw new AppError("INTERNAL_ERROR", "Photo URL exceeds storage limit");
    }
    await prisma.userPreference.upsert({
      where: { memberId },
      create: { memberId, photoUrl: blob.url },
      update: { photoUrl: blob.url },
      select: { photoUrl: true },
    });
    if (existing?.photoUrl && existing.photoUrl !== blob.url) {
      try {
        await del(existing.photoUrl);
      } catch {
        // Swallow not-found.
      }
    }
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
