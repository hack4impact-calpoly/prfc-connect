import "server-only";
import prisma from "@/lib/db";
import { transformError } from "@/utils/errors";

export interface UserPreferenceData {
  notifyEmailDefault: boolean;
  notifySmsDefault: boolean;
}

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
