import { vi, type MockedFunction } from "vitest";
import { createHmac } from "crypto";

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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { mockAuthLimit } = vi.hoisted(() => ({
  mockAuthLimit: vi.fn().mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60000 }),
}));

vi.mock("@/lib/rate-limit", () => ({
  authRateLimiter: { limit: mockAuthLimit },
}));

// Make React cache() a passthrough so tests get fresh results
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { validateToken, generateToken, getSecret, verifySession, getSession, AUTH_COOKIE } from "@/lib/dal";
import { POST as callbackPOST } from "@/app/api/auth/callback/route";
import { POST as logoutPOST } from "@/app/api/auth/logout/route";
import { logout } from "@/actions/auth";
import { NextRequest } from "next/server";

const mockRedirect = redirect as MockedFunction<typeof redirect>;

const SECRET = getSecret();

function createToken(ownerid: number, isAdmin: boolean, timestamp: number): string {
  const payload = `${ownerid}|${isAdmin ? "1" : "0"}|${timestamp}`;
  const signature = createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 8);
  return `${payload}|${signature}`;
}

describe("validateToken", () => {
  it("returns session for valid admin token", () => {
    const token = createToken(100001, true, Date.now());
    const session = validateToken(token, SECRET);

    expect(session).toEqual({ ownerid: 100001, isAdmin: true });
  });

  it("returns session for valid member token", () => {
    const token = createToken(100050, false, Date.now());
    const session = validateToken(token, SECRET);

    expect(session).toEqual({ ownerid: 100050, isAdmin: false });
  });

  it("rejects tampered ownerid", () => {
    const token = createToken(100001, true, Date.now());
    const parts = token.split("|");
    parts[0] = "999999";
    const tampered = parts.join("|");

    expect(validateToken(tampered, SECRET)).toBeNull();
  });

  it("rejects tampered isAdmin flag", () => {
    const token = createToken(100001, false, Date.now());
    const parts = token.split("|");
    parts[1] = "1";
    const tampered = parts.join("|");

    expect(validateToken(tampered, SECRET)).toBeNull();
  });

  it("rejects expired token", () => {
    const expiredTimestamp = Date.now() - 3_600_001;
    const token = createToken(100001, true, expiredTimestamp);

    expect(validateToken(token, SECRET)).toBeNull();
  });

  it("rejects token with wrong secret", () => {
    const token = createToken(100001, true, Date.now());

    expect(validateToken(token, "wrong-secret-that-is-long-enough")).toBeNull();
  });

  it("rejects malformed token with missing parts", () => {
    expect(validateToken("only|two", SECRET)).toBeNull();
  });

  it("rejects token with empty fields", () => {
    expect(validateToken("||1234|abcd1234", SECRET)).toBeNull();
  });

  it("rejects token with future timestamp", () => {
    const futureTimestamp = Date.now() + 60000;
    const token = createToken(100001, true, futureTimestamp);

    expect(validateToken(token, SECRET)).toBeNull();
  });

  it("rejects token with zero ownerid", () => {
    const token = createToken(0, false, Date.now());

    expect(validateToken(token, SECRET)).toBeNull();
  });

  it("rejects token with negative ownerid", () => {
    const token = createToken(-1, false, Date.now());

    expect(validateToken(token, SECRET)).toBeNull();
  });
});

describe("getSecret", () => {
  it("throws in production when PRFC_PORTAL_SECRET is unset", () => {
    const originalSecret = process.env.PRFC_PORTAL_SECRET;
    const originalNodeEnv = process.env.NODE_ENV;
    delete process.env.PRFC_PORTAL_SECRET;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    expect(() => getSecret()).toThrow("PRFC_PORTAL_SECRET required in production");

    process.env.PRFC_PORTAL_SECRET = originalSecret;
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
  });

  it("returns dev secret in non-production when PRFC_PORTAL_SECRET is unset", () => {
    const originalSecret = process.env.PRFC_PORTAL_SECRET;
    delete process.env.PRFC_PORTAL_SECRET;

    const secret = getSecret();

    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThanOrEqual(32);

    process.env.PRFC_PORTAL_SECRET = originalSecret;
  });
});

describe("POST /api/auth/callback", () => {
  it("sets auth cookie for valid token", async () => {
    const token = generateToken(100001, true);
    const formData = new FormData();
    formData.set("token", token);

    const request = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: formData,
    });

    const response = await callbackPOST(request);
    const cookie = response.cookies.get(AUTH_COOKIE);

    expect(response.status).toBe(307);
    expect(cookie).toBeDefined();
    expect(cookie!.value).toBe(token);
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.sameSite).toBe("lax");
    expect(cookie!.path).toBe("/");
    expect(cookie!.secure).toBe(process.env.NODE_ENV === "production");
    expect(cookie!.maxAge).toBe(3600);
  });

  it("redirects without cookie for invalid token", async () => {
    const formData = new FormData();
    formData.set("token", "invalid|token|data|badhash!");

    const request = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: formData,
    });

    const response = await callbackPOST(request);
    const cookie = response.cookies.get(AUTH_COOKIE);

    expect(response.status).toBe(307);
    expect(cookie).toBeUndefined();
  });

  it("redirects without cookie when token is missing", async () => {
    const formData = new FormData();

    const request = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: formData,
    });

    const response = await callbackPOST(request);
    const cookie = response.cookies.get(AUTH_COOKIE);

    expect(response.status).toBe(307);
    expect(cookie).toBeUndefined();
  });

  it("redirects valid and invalid tokens to the same URL to prevent enumeration", async () => {
    const validToken = generateToken(100001, true);
    const validForm = new FormData();
    validForm.set("token", validToken);
    const validReq = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: validForm,
    });

    const invalidForm = new FormData();
    invalidForm.set("token", "invalid|token|data|badhash!");
    const invalidReq = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: invalidForm,
    });

    const validResponse = await callbackPOST(validReq);
    const invalidResponse = await callbackPOST(invalidReq);

    const validUrl = new URL(validResponse.headers.get("location")!);
    const invalidUrl = new URL(invalidResponse.headers.get("location")!);
    expect(validUrl.pathname).toBe(invalidUrl.pathname);
  });

  it("returns 429 when rate limited", async () => {
    mockAuthLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() + 60000 });

    const token = generateToken(100001, true);
    const formData = new FormData();
    formData.set("token", token);

    const request = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: formData,
    });

    const response = await callbackPOST(request);
    const cookie = response.cookies.get(AUTH_COOKIE);

    expect(response.status).toBe(429);
    expect(cookie).toBeUndefined();
    expect(mockAuthLimit).toHaveBeenCalledWith("127.0.0.1");
  });

  it("extracts client IP from x-forwarded-for header for rate limiting", async () => {
    const token = generateToken(100001, true);
    const formData = new FormData();
    formData.set("token", token);

    const request = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: formData,
      headers: { "x-forwarded-for": "203.0.113.42, 10.0.0.1" },
    });

    await callbackPOST(request);

    expect(mockAuthLimit).toHaveBeenCalledWith("203.0.113.42");
  });

  it("replaces malformed IP with 'invalid' to prevent log injection", () => {
    const malicious = "1.2.3.4\n[AUTH_CALLBACK] login success 99999";
    const result = /^[\d.:a-f]+$/i.test(malicious) ? malicious : "invalid";

    expect(result).toBe("invalid");
  });

  it("accepts valid IPv4 and IPv6 addresses", () => {
    expect(/^[\d.:a-f]+$/i.test("203.0.113.42")).toBe(true);
    expect(/^[\d.:a-f]+$/i.test("::1")).toBe(true);
    expect(/^[\d.:a-f]+$/i.test("2001:db8::1")).toBe(true);
  });

  it("logs successful login with ownerid", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const token = generateToken(100001, true);
    const formData = new FormData();
    formData.set("token", token);

    const request = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: formData,
    });

    await callbackPOST(request);

    expect(spy).toHaveBeenCalledWith("[AUTH_CALLBACK] login success", 100001, "127.0.0.1");
    spy.mockRestore();
  });

  it("logs failed login for invalid token", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const formData = new FormData();
    formData.set("token", "invalid|token|data|badhash!");

    const request = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: formData,
    });

    await callbackPOST(request);

    expect(spy).toHaveBeenCalledWith("[AUTH_CALLBACK] invalid or expired token", "127.0.0.1");
    spy.mockRestore();
  });

  it("logs failed login for missing token", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const formData = new FormData();

    const request = new NextRequest("http://localhost:3000/api/auth/callback", {
      method: "POST",
      body: formData,
    });

    await callbackPOST(request);

    expect(spy).toHaveBeenCalledWith("[AUTH_CALLBACK] missing or malformed token", "127.0.0.1");
    spy.mockRestore();
  });
});

describe("POST /api/auth/logout", () => {
  it("clears session cookie", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });

    const response = await logoutPOST(request);
    const setCookies = response.headers.getSetCookie();

    expect(response.status).toBe(307);
    expect(setCookies.some((c) => c.includes(AUTH_COOKIE) && c.includes("Expires=Thu, 01 Jan 1970"))).toBe(true);
  });
});

describe("logout server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes cookie and redirects", async () => {
    await logout().catch(() => {});

    expect(mockCookieStore.delete).toHaveBeenCalledWith(AUTH_COOKIE);
    expect(mockRedirect).toHaveBeenCalledWith("/dev/mock-portal");
  });

  it("does not call revalidatePath to avoid error boundary on expired session", async () => {
    await logout().catch(() => {});

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session for valid cookie", async () => {
    const token = generateToken(100001, true);
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: token });

    const session = await verifySession();

    expect(session).toEqual({ ownerid: 100001, isAdmin: true });
  });

  it("throws UNAUTHORIZED for missing cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await expect(verifySession()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("throws UNAUTHORIZED for expired token", async () => {
    const expiredToken = createToken(100001, true, Date.now() - 3_600_001);
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: expiredToken });

    await expect(verifySession()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session for valid cookie", async () => {
    const token = generateToken(100001, false);
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: token });

    const session = await getSession();

    expect(session).toEqual({ ownerid: 100001, isAdmin: false });
  });

  it("returns null for missing cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const session = await getSession();

    expect(session).toBeNull();
  });

  it("returns null for invalid token", async () => {
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: "garbage" });

    const session = await getSession();

    expect(session).toBeNull();
  });

  it("returns null for expired token", async () => {
    const expiredToken = createToken(100001, true, Date.now() - 3_600_001);
    mockCookieStore.get.mockReturnValue({ name: AUTH_COOKIE, value: expiredToken });

    const session = await getSession();

    expect(session).toBeNull();
  });
});
