import { vi } from "vitest";

vi.mock("@/services/user-preference", () => ({
  getUserPreferences: vi.fn(),
  updateUserPreferences: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  getProfilePhotoUrl: vi.fn(),
  deleteProfilePhoto: vi.fn(),
}));

import {
  getUserPreferences,
  updateUserPreferences,
  uploadProfilePhoto,
  getProfilePhotoUrl,
  deleteProfilePhoto,
} from "@/services/user-preference";

export const mockGetUserPreferences = vi.mocked(getUserPreferences);
export const mockUpdateUserPreferences = vi.mocked(updateUserPreferences);
export const mockUploadProfilePhoto = vi.mocked(uploadProfilePhoto);
export const mockGetProfilePhotoUrl = vi.mocked(getProfilePhotoUrl);
export const mockDeleteProfilePhoto = vi.mocked(deleteProfilePhoto);
