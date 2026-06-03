import { vi } from "vitest";

vi.mock("@/env", () => ({
  env: { PRFC_PORTAL_API_URL: "https://portal.test/actions/", MEMBER_API_SECRET: "test-secret" },
}));

const { mockCookieStore } = vi.hoisted(() => ({
  mockCookieStore: { get: vi.fn() },
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

import { validatePortalToken, fetchMemberContacts, fetchListMembers, getPortalToken } from "@/lib/api/portal-api";

function mockFetch(text: string, ok = true, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, status, text: () => Promise.resolve(text) }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("validatePortalToken", () => {
  it("returns the session for a valid token", async () => {
    mockFetch(`{"ownerid" : "100184","secondsleft" : "3599","isadmin" : "1"}`);
    expect(await validatePortalToken("tok")).toEqual({ ownerid: 100184, isAdmin: true });
  });

  it("returns isAdmin false for a non-admin", async () => {
    mockFetch(`{"ownerid" : "100003","secondsleft" : "3599","isadmin" : "0"}`);
    expect(await validatePortalToken("tok")).toEqual({ ownerid: 100003, isAdmin: false });
  });

  it("rejects BAD_CHECKSUM even with leading PHP notices", async () => {
    mockFetch(
      `<br />\n<b>Notice</b>:  Undefined offset: 2 in <b>/home/httpd/html/accounts/actions/index.htm</b> on line <b>358</b><br />\n{"ownerid" : "BAD_CHECKSUM","secondsleft" : "0","isadmin" : "0"}`,
    );
    expect(await validatePortalToken("tok")).toBeNull();
  });

  it("rejects an expired token (secondsleft 0)", async () => {
    mockFetch(`{"ownerid" : "100184","secondsleft" : "0","isadmin" : "1"}`);
    expect(await validatePortalToken("tok")).toBeNull();
  });

  it("returns null when the portal call throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await validatePortalToken("tok")).toBeNull();
  });
});

describe("fetchMemberContacts", () => {
  it("parses the trailing-comma array and maps API fields to tblowner fields", async () => {
    mockFetch(
      `[{"ownerid" : "100001","ownername" : "Sue","email" : "sue@x.com","phone" : "805-1","altphone" : ""}, {"ownerid" : "100003","ownername" : "Lyd","email" : "l@x.com","phone" : "805-2","altphone" : "805-3"}, ]`,
    );
    expect(await fetchMemberContacts([100001, 100003])).toEqual([
      { ownerid: 100001, ownername: "Sue", owneremail: "sue@x.com", ownerphone: "805-1", owneraltphone: undefined },
      { ownerid: 100003, ownername: "Lyd", owneremail: "l@x.com", ownerphone: "805-2", owneraltphone: "805-3" },
    ]);
  });

  it("returns empty without calling fetch when given no ids", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await fetchMemberContacts([])).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("fetchListMembers", () => {
  it("parses the <br>-separated roster into typed summaries", async () => {
    mockFetch(
      `[{"ownerid" : "100001","ownername" : "Sue Aiken"}<br>\n{"ownerid" : "100002","ownername" : "Bob"}<br>\n]`,
    );
    expect(await fetchListMembers("tok")).toEqual([
      { ownerid: 100001, ownername: "Sue Aiken" },
      { ownerid: 100002, ownername: "Bob" },
    ]);
  });
});

describe("getPortalToken", () => {
  it("reads the portal token cookie", async () => {
    mockCookieStore.get.mockReturnValue({ value: "the-token" });
    expect(await getPortalToken()).toBe("the-token");
  });

  it("returns null when the cookie is missing", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    expect(await getPortalToken()).toBeNull();
  });
});
