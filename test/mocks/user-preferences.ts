import type { UserPreferenceData } from "@/services/user-preference";

export const defaultPreferences: UserPreferenceData = {
  notifyEmailDefault: true,
  notifySmsDefault: false,
};

export const allEnabledPreferences: UserPreferenceData = {
  notifyEmailDefault: true,
  notifySmsDefault: true,
};

export const allDisabledPreferences: UserPreferenceData = {
  notifyEmailDefault: false,
  notifySmsDefault: false,
};
