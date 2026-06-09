import { vi, describe, it, expect, afterEach } from "vitest";
import "../../mocks/encryption";
import { validatePortalToken, fetchListMembers, fetchMemberContacts } from "@/lib/api/portal-api";
import { blindIndex } from "@/lib/encryption";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("portal fetch resilience", () => {
  it("aborts a hung portal request via an AbortSignal timeout", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        async () => new Response('{"ownerid":"100230","secondsleft":"3000","isadmin":"0"}', { status: 200 }),
      );

    await validatePortalToken("any-token");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0][1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("degrades to null when the portal request times out, instead of hanging", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new DOMException("timed out", "TimeoutError");
    });

    const result = await validatePortalToken("any-token");

    expect(result).toBeNull();
  });
});

describe("portal data shapes", () => {
  it("passes an empty primary phone through as an empty string, which cannot key an SMS consent", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(
          '[{"ownerid":"100230","ownername":"Ann Spencer","email":"a@example.com","phone":"","altphone":""}]',
          { status: 200 },
        ),
    );

    const members = await fetchMemberContacts([100230]);

    expect(members[0].ownerphone).toBe("");
    expect(members[0].owneraltphone).toBeUndefined();
    expect(blindIndex("")).not.toBe(blindIndex("805-438-3543"));
  });
});

describe("portal error detection (portal answers 200 even on failure)", () => {
  it("surfaces a clear error, not an opaque parse failure, when the secret is rejected", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(
          '{"ownerid" : "INVALID_KEY","ownername" : "INVALID_KEY","email" : "NONE", "phone" : "NONE", "altphone" : "NONE"}',
          { status: 200 },
        ),
    );

    await expect(fetchMemberContacts([100230])).rejects.toThrow(/invalid secret or token/i);
  });

  it("surfaces a clear error when the portal returns a PHP notice instead of data", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(
          "<br /><b>Notice</b>:  Undefined index: token in <b>/home/httpd/html/accounts/actions/index.htm</b> on line <b>383</b>",
          { status: 200 },
        ),
    );

    await expect(fetchListMembers("")).rejects.toThrow(/server error/i);
  });

  it("login degrades to null when the portal returns its rejection sentinel", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response('{"ownerid" : "INVALID_KEY","secondsleft" : "0","isadmin" : "0"}', { status: 200 }),
    );

    const result = await validatePortalToken("any-token");

    expect(result).toBeNull();
  });
});
