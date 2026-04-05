import "../mocks/next-cache";
import "../mocks/dal";

import { vi, type MockedFunction } from "vitest";
import { AppError } from "@/utils/errors";
import { mockVerifySession, mockRevalidatePath } from "../mocks";

vi.mock("@/services/sms-consent", () => ({
  getMemberSmsConsent: vi.fn(),
  revokeSmsConsent: vi.fn(),
}));

vi.mock("@/services/user-preference", () => ({
  getUserPreferences: vi.fn(),
  updateUserPreferences: vi.fn(),
}));

import { getMemberSmsConsent, revokeSmsConsent } from "@/services/sms-consent";
import { getUserPreferences, updateUserPreferences } from "@/services/user-preference";
import {
  fetchSmsConsent,
  revokeSmsConsentAction,
  fetchUserPreferences,
  updateUserPreferencesAction,
} from "@/actions/settings";

const mockGetMemberSmsConsent = getMemberSmsConsent as MockedFunction<typeof getMemberSmsConsent>;
const mockRevokeSmsConsent = revokeSmsConsent as MockedFunction<typeof revokeSmsConsent>;
const mockGetUserPreferences = getUserPreferences as MockedFunction<typeof getUserPreferences>;
const mockUpdateUserPreferences = updateUserPreferences as MockedFunction<typeof updateUserPreferences>;

const fullConsent = {
  id: 1,
  memberId: 100001,
  consentedAt: new Date("2026-01-15"),
  consentMethod: "web_form",
  consentText: "I agree to receive SMS messages",
  consentPurpose: "group_notifications",
  revokedAt: null,
  revokeMethod: null,
};

describe("fetchSmsConsent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("returns full consent record shape for authenticated member", async () => {
    mockGetMemberSmsConsent.mockResolvedValue(fullConsent);

    const result = await fetchSmsConsent();

    expect(result).toEqual({ success: true, data: fullConsent });
    expect(result.data).toHaveProperty("consentedAt");
    expect(result.data).toHaveProperty("consentMethod");
    expect(result.data).toHaveProperty("consentText");
    expect(result.data).toHaveProperty("consentPurpose");
    expect(result.data).toHaveProperty("revokedAt");
    expect(result.data).toHaveProperty("revokeMethod");
  });

  it("returns null data when no active consent", async () => {
    mockGetMemberSmsConsent.mockResolvedValue(null);

    const result = await fetchSmsConsent();

    expect(result).toEqual({ success: true, data: null });
  });

  it("returns error with no data field when not authenticated", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await fetchSmsConsent();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
    expect(result).not.toHaveProperty("data");
  });
});

describe("revokeSmsConsentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("revokes consent and revalidates settings path", async () => {
    mockRevokeSmsConsent.mockResolvedValue(undefined);

    const result = await revokeSmsConsentAction({ method: "user_settings", message: null });

    expect(result.success).toBe(true);
    expect(mockRevokeSmsConsent).toHaveBeenCalledWith(100001, "user_settings", null);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("rejects empty method string", async () => {
    const result = await revokeSmsConsentAction({ method: "", message: null });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result).not.toHaveProperty("data");
  });

  it("rejects method longer than 50 characters", async () => {
    const result = await revokeSmsConsentAction({ method: "a".repeat(51), message: null });

    expect(result.success).toBe(false);
  });
});

describe("fetchUserPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("returns both preference fields", async () => {
    mockGetUserPreferences.mockResolvedValue({ notifyEmailDefault: true, notifySmsDefault: false });

    const result = await fetchUserPreferences();

    expect(result).toEqual({
      success: true,
      data: { notifyEmailDefault: true, notifySmsDefault: false },
    });
    expect(result.data).toHaveProperty("notifyEmailDefault");
    expect(result.data).toHaveProperty("notifySmsDefault");
  });
});

describe("updateUserPreferencesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("returns updated preferences and revalidates settings path", async () => {
    mockUpdateUserPreferences.mockResolvedValue({ notifyEmailDefault: false, notifySmsDefault: false });

    const result = await updateUserPreferencesAction({ notifyEmailDefault: false });

    expect(result).toEqual({
      success: true,
      data: { notifyEmailDefault: false, notifySmsDefault: false },
    });
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
