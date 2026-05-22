import "../mocks/next-cache";
import "../mocks/dal";
import "../mocks/sms-consent-service";
import "../mocks/profile-service";
import "../mocks/user-preference-service";

import { AppError } from "@/utils/errors";
import {
  mockVerifySession,
  mockRevalidatePath,
  allDisabledPreferences,
  mockUpdateUserPreferences,
  mockUploadProfilePhoto,
} from "../mocks";
import { updateUserPreferencesAction, uploadPhotoAction } from "@/actions/settings";

describe("updateUserPreferencesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("returns updated preferences and revalidates settings path", async () => {
    mockUpdateUserPreferences.mockResolvedValue(allDisabledPreferences);

    const result = await updateUserPreferencesAction({ notifyEmailDefault: false });

    expect(result).toEqual({ success: true, data: allDisabledPreferences });
    expect(mockUpdateUserPreferences).toHaveBeenCalledWith(100001, { notifyEmailDefault: false });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("rejects when no preference field provided", async () => {
    const result = await updateUserPreferencesAction({});

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty("data");
  });

  it("rejects non-boolean values", async () => {
    const result = await updateUserPreferencesAction({ notifyEmailDefault: "yes" as never });

    expect(result.success).toBe(false);
  });
});

describe("uploadPhotoAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("calls uploadProfilePhoto with session ownerid and the FormData file, returns the url, revalidates settings", async () => {
    const file = new File([new Uint8Array(1024)], "photo.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.set("file", file);
    mockUploadProfilePhoto.mockResolvedValue("https://abc.public.blob.vercel-storage.com/avatars/100001.jpg");

    const result = await uploadPhotoAction(formData);

    expect(result).toEqual({
      success: true,
      data: { url: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg" },
    });
    expect(mockUploadProfilePhoto).toHaveBeenCalledWith(100001, file);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns error when no file is in the FormData", async () => {
    const formData = new FormData();

    const result = await uploadPhotoAction(formData);

    expect(result).toEqual({ success: false, error: "No file provided" });
    expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
  });

  it("returns error when not authenticated", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));
    const formData = new FormData();
    formData.set("file", new File([new Uint8Array(1024)], "photo.jpg", { type: "image/jpeg" }));

    const result = await uploadPhotoAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
    expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
  });

  it("returns error when FormData file key is a string", async () => {
    const formData = new FormData();
    formData.set("file", "not-a-file");

    const result = await uploadPhotoAction(formData);

    expect(result).toEqual({ success: false, error: "No file provided" });
    expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
  });

  it("returns error when file MIME type is not JPEG or PNG", async () => {
    const file = new File([new Uint8Array(1024)], "avatar.gif", { type: "image/gif" });
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadPhotoAction(formData);

    expect(result).toEqual({ success: false, error: "Only JPEG and PNG files are allowed" });
    expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
  });

  it("returns error when file exceeds 2MB", async () => {
    const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadPhotoAction(formData);

    expect(result).toEqual({ success: false, error: "File must be under 2MB" });
    expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
  });

  it("returns error when file is zero bytes", async () => {
    const file = new File([], "empty.png", { type: "image/png" });
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadPhotoAction(formData);

    expect(result).toEqual({ success: false, error: "No file provided" });
    expect(mockUploadProfilePhoto).not.toHaveBeenCalled();
  });
});
