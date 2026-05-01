import { vi, type MockedFunction } from "vitest";
import { mockPrisma } from "../mocks/prisma";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

import { put, del } from "@vercel/blob";
import {
  getUserPreferences,
  updateUserPreferences,
  uploadProfilePhoto,
  getProfilePhotoUrl,
  deleteProfilePhoto,
} from "@/services/user-preference";

const mockPut = put as MockedFunction<typeof put>;
const mockDel = del as MockedFunction<typeof del>;

function makeFile(type: string, size: number): File {
  if (size === 0) return new File([], "photo", { type });
  const data = new Uint8Array(Math.max(size, 8));
  if (type === "image/jpeg") {
    data[0] = 0xff;
    data[1] = 0xd8;
    data[2] = 0xff;
  } else if (type === "image/png") {
    data[0] = 0x89;
    data[1] = 0x50;
    data[2] = 0x4e;
    data[3] = 0x47;
  }
  return new File([data.slice(0, size)], "photo", { type });
}

describe("getUserPreferences", () => {
  it("returns stored preferences when record exists", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue({
      notifyEmailDefault: false,
      notifySmsDefault: true,
    } as never);

    const result = await getUserPreferences(100001);

    expect(result).toEqual({ notifyEmailDefault: false, notifySmsDefault: true });
  });

  it("returns defaults when no record exists", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);

    const result = await getUserPreferences(100001);

    expect(result).toEqual({ notifyEmailDefault: true, notifySmsDefault: false });
  });

  it("throws on database error", async () => {
    mockPrisma.userPreference.findUnique.mockRejectedValue(new Error("Connection lost"));

    await expect(getUserPreferences(100001)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("updateUserPreferences", () => {
  it("upserts with provided fields and defaults for missing fields", async () => {
    mockPrisma.userPreference.upsert.mockResolvedValue({
      notifyEmailDefault: false,
      notifySmsDefault: false,
    } as never);

    await updateUserPreferences(100001, { notifyEmailDefault: false });

    expect(mockPrisma.userPreference.upsert).toHaveBeenCalledWith({
      where: { memberId: 100001 },
      create: { memberId: 100001, notifyEmailDefault: false, notifySmsDefault: false },
      update: { notifyEmailDefault: false },
      select: { notifyEmailDefault: true, notifySmsDefault: true },
    });
  });

  it("returns updated preferences", async () => {
    mockPrisma.userPreference.upsert.mockResolvedValue({
      notifyEmailDefault: true,
      notifySmsDefault: true,
    } as never);

    const result = await updateUserPreferences(100001, { notifySmsDefault: true });

    expect(result).toEqual({ notifyEmailDefault: true, notifySmsDefault: true });
  });

  it("throws on database error", async () => {
    mockPrisma.userPreference.upsert.mockRejectedValue(new Error("Connection lost"));

    await expect(updateUserPreferences(100001, { notifyEmailDefault: true })).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});

describe("uploadProfilePhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects file types that are not JPG or PNG", async () => {
    await expect(uploadProfilePhoto(100001, makeFile("image/gif", 1024))).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("rejects empty files", async () => {
    await expect(uploadProfilePhoto(100001, makeFile("image/jpeg", 0))).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("rejects files larger than 2MB", async () => {
    await expect(uploadProfilePhoto(100001, makeFile("image/jpeg", 2 * 1024 * 1024 + 1))).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("uploads a JPEG to avatars/{memberId}.jpg and upserts photoUrl", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg",
    } as never);
    mockPrisma.userPreference.upsert.mockResolvedValue({
      photoUrl: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg",
    } as never);

    const url = await uploadProfilePhoto(100001, makeFile("image/jpeg", 1024));

    expect(mockPut).toHaveBeenCalledWith("avatars/100001.jpg", expect.any(File), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    expect(mockPrisma.userPreference.upsert).toHaveBeenCalledWith({
      where: { memberId: 100001 },
      create: { memberId: 100001, photoUrl: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg" },
      update: { photoUrl: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg" },
      select: { photoUrl: true },
    });
    expect(url).toBe("https://abc.public.blob.vercel-storage.com/avatars/100001.jpg");
  });

  it("uploads a PNG to avatars/{memberId}.png", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: "https://abc.public.blob.vercel-storage.com/avatars/100001.png",
    } as never);
    mockPrisma.userPreference.upsert.mockResolvedValue({
      photoUrl: "https://abc.public.blob.vercel-storage.com/avatars/100001.png",
    } as never);

    await uploadProfilePhoto(100001, makeFile("image/png", 1024));

    expect(mockPut).toHaveBeenCalledWith("avatars/100001.png", expect.any(File), expect.any(Object));
  });

  it("deletes the old blob after uploading new one when photoUrl changes", async () => {
    const oldUrl = "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg";
    mockPrisma.userPreference.findUnique.mockResolvedValue({ photoUrl: oldUrl } as never);
    mockDel.mockResolvedValue(undefined);
    mockPut.mockResolvedValue({
      url: "https://abc.public.blob.vercel-storage.com/avatars/100001.png",
    } as never);
    mockPrisma.userPreference.upsert.mockResolvedValue({
      photoUrl: "https://abc.public.blob.vercel-storage.com/avatars/100001.png",
    } as never);

    await uploadProfilePhoto(100001, makeFile("image/png", 1024));

    expect(mockPut).toHaveBeenCalled();
    expect(mockDel).toHaveBeenCalledWith(oldUrl);
  });

  it("skips delete when no existing photoUrl", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue({ photoUrl: null } as never);
    mockPut.mockResolvedValue({
      url: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg",
    } as never);
    mockPrisma.userPreference.upsert.mockResolvedValue({
      photoUrl: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg",
    } as never);

    await uploadProfilePhoto(100001, makeFile("image/jpeg", 1024));

    expect(mockDel).not.toHaveBeenCalled();
  });

  it("accepts a file exactly at the 2MB boundary", async () => {
    const exactLimit = 2 * 1024 * 1024;
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg",
    } as never);
    mockPrisma.userPreference.upsert.mockResolvedValue({
      photoUrl: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg",
    } as never);

    const url = await uploadProfilePhoto(100001, makeFile("image/jpeg", exactLimit));

    expect(url).toBe("https://abc.public.blob.vercel-storage.com/avatars/100001.jpg");
  });

  it("rejects a file from empty Blob constructor", async () => {
    const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });

    await expect(uploadProfilePhoto(100001, emptyFile)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Profile photo file is empty",
    });
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("preserves old photo when put fails", async () => {
    const oldUrl = "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg";
    mockPrisma.userPreference.findUnique.mockResolvedValue({ photoUrl: oldUrl } as never);
    mockPut.mockRejectedValue(new Error("Blob storage unavailable"));

    await expect(uploadProfilePhoto(100001, makeFile("image/jpeg", 1024))).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });

    expect(mockDel).not.toHaveBeenCalled();
    expect(mockPrisma.userPreference.upsert).not.toHaveBeenCalled();
  });

  it("rejects file with spoofed MIME type but invalid magic bytes", async () => {
    const fakeImage = new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00])], "fake.jpg", {
      type: "image/jpeg",
    });

    await expect(uploadProfilePhoto(100001, fakeImage)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "File content does not match a valid JPG or PNG image",
    });
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("rejects blob URL exceeding database field limit", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);
    const longUrl = "https://abc.public.blob.vercel-storage.com/" + "a".repeat(500);
    mockPut.mockResolvedValue({ url: longUrl } as never);
    mockDel.mockResolvedValue(undefined);

    await expect(uploadProfilePhoto(100001, makeFile("image/jpeg", 1024))).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });

    expect(mockDel).toHaveBeenCalledWith(longUrl);
    expect(mockPrisma.userPreference.upsert).not.toHaveBeenCalled();
  });
});

describe("getProfilePhotoUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the stored photoUrl", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue({
      photoUrl: "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg",
    } as never);

    const result = await getProfilePhotoUrl(100001);

    expect(result).toBe("https://abc.public.blob.vercel-storage.com/avatars/100001.jpg");
  });

  it("returns null when no record exists", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue(null);

    const result = await getProfilePhotoUrl(100001);

    expect(result).toBeNull();
  });
});

describe("deleteProfilePhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the blob and clears photoUrl when set", async () => {
    const url = "https://abc.public.blob.vercel-storage.com/avatars/100001.jpg";
    mockPrisma.userPreference.findUnique.mockResolvedValue({ photoUrl: url } as never);
    mockDel.mockResolvedValue(undefined);
    mockPrisma.userPreference.update.mockResolvedValue({} as never);

    await deleteProfilePhoto(100001);

    expect(mockDel).toHaveBeenCalledWith(url);
    expect(mockPrisma.userPreference.update).toHaveBeenCalledWith({
      where: { memberId: 100001 },
      data: { photoUrl: null },
    });
  });

  it("no-ops when no photoUrl is set", async () => {
    mockPrisma.userPreference.findUnique.mockResolvedValue({ photoUrl: null } as never);

    await deleteProfilePhoto(100001);

    expect(mockDel).not.toHaveBeenCalled();
    expect(mockPrisma.userPreference.update).not.toHaveBeenCalled();
  });
});
