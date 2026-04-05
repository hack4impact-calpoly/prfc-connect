import { vi, type MockedFunction } from "vitest";
import { AppError } from "@/utils/errors";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/dal", () => ({
  verifySession: vi.fn(),
}));

vi.mock("@/services/sms-consent", () => ({
  getMemberSmsConsent: vi.fn(),
  revokeSmsConsent: vi.fn(),
}));

vi.mock("@/services/user-preference", () => ({
  getUserPreferences: vi.fn(),
  updateUserPreferences: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { getMemberSmsConsent, revokeSmsConsent } from "@/services/sms-consent";
import { getUserPreferences, updateUserPreferences } from "@/services/user-preference";
import {
  fetchSmsConsent,
  revokeSmsConsentAction,
  fetchUserPreferences,
  updateUserPreferencesAction,
} from "@/actions/settings";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockVerifySession = verifySession as MockedFunction<typeof verifySession>;
const mockGetMemberSmsConsent = getMemberSmsConsent as MockedFunction<typeof getMemberSmsConsent>;
const mockRevokeSmsConsent = revokeSmsConsent as MockedFunction<typeof revokeSmsConsent>;
const mockGetUserPreferences = getUserPreferences as MockedFunction<typeof getUserPreferences>;
const mockUpdateUserPreferences = updateUserPreferences as MockedFunction<typeof updateUserPreferences>;

describe("fetchSmsConsent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("returns consent record for authenticated member", async () => {
    const consent = { id: 1, memberId: 100001, consentedAt: new Date() };
    mockGetMemberSmsConsent.mockResolvedValue(consent as never);

    const result = await fetchSmsConsent();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(consent);
  });

  it("returns error when not authenticated", async () => {
    mockVerifySession.mockRejectedValue(new AppError("UNAUTHORIZED", "Authentication required"));

    const result = await fetchSmsConsent();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
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
  });
});

describe("fetchUserPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("returns preferences for authenticated member", async () => {
    const prefs = { notifyEmailDefault: true, notifySmsDefault: false };
    mockGetUserPreferences.mockResolvedValue(prefs);

    const result = await fetchUserPreferences();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(prefs);
  });
});

describe("updateUserPreferencesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySession.mockResolvedValue({ ownerid: 100001, isAdmin: false });
  });

  it("updates preferences and revalidates settings path", async () => {
    const updated = { notifyEmailDefault: false, notifySmsDefault: false };
    mockUpdateUserPreferences.mockResolvedValue(updated);

    const result = await updateUserPreferencesAction({ notifyEmailDefault: false });

    expect(result.success).toBe(true);
    expect(mockUpdateUserPreferences).toHaveBeenCalledWith(100001, { notifyEmailDefault: false });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("rejects when no preference field provided", async () => {
    const result = await updateUserPreferencesAction({});

    expect(result.success).toBe(false);
  });
});
