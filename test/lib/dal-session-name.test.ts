import { vi } from "vitest";
import { mockGetMemberById } from "../mocks/member-api";

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

import { generateToken, getSessionWithName, AUTH_COOKIE } from "@/lib/dal";

describe("getSessionWithName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session with member name for valid cookie", async () => {
    const token = generateToken(100001, true);
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: token });
    mockGetMemberById.mockResolvedValue({
      ownerid: 100001,
      ownername: "Kermit",
      owneremail: "kermit@example.com",
      ownerphone: "+15550001",
    });

    const session = await getSessionWithName();

    expect(session).toEqual({ ownerid: 100001, isAdmin: true, ownername: "Kermit" });
  });

  it("falls back to Member when getMemberById returns null", async () => {
    const token = generateToken(100001, false);
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: token });
    mockGetMemberById.mockResolvedValue(null);

    const session = await getSessionWithName();

    expect(session.ownername).toBe("Member");
  });

  it("throws UNAUTHORIZED when no cookie present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await expect(getSessionWithName()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("throws UNAUTHORIZED when token is expired", async () => {
    const payload = `100001|1|${Date.now() - 3_600_001}`;
    const crypto = await import("crypto");
    const secret = (await import("@/lib/dal")).getSecret();
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 8);
    const expiredToken = `${payload}|${signature}`;

    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: expiredToken });

    await expect(getSessionWithName()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("calls getMemberById with session ownerid", async () => {
    const token = generateToken(100050, false);
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: token });
    mockGetMemberById.mockResolvedValue({
      ownerid: 100050,
      ownername: "Alice",
      owneremail: "alice@example.com",
      ownerphone: "+15550050",
    });

    await getSessionWithName();

    expect(mockGetMemberById).toHaveBeenCalledWith(100050);
  });

  it("propagates error when getMemberById throws", async () => {
    const token = generateToken(100001, true);
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: token });
    mockGetMemberById.mockRejectedValue(new Error("API unavailable"));

    await expect(getSessionWithName()).rejects.toThrow("API unavailable");
  });

  it("throws UNAUTHORIZED for empty cookie value", async () => {
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: "" });

    await expect(getSessionWithName()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
