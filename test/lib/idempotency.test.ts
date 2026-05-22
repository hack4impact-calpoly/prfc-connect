import { vi } from "vitest";

const { mockGet, mockSet } = vi.hoisted(() => {
  process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
  return {
    mockGet: vi.fn(),
    mockSet: vi.fn(),
  };
});

vi.mock("@upstash/redis", () => ({
  Redis: class {
    get = mockGet;
    set = mockSet;
  },
}));

import { claimIdempotencyKey, setIdempotentResponse } from "@/lib/idempotency";

describe("claimIdempotencyKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns claimed when key does not exist and SET NX succeeds", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue("OK");

    const result = await claimIdempotencyKey("new-key");

    expect(result).toEqual({ claimed: true });
    expect(mockSet).toHaveBeenCalledWith("idempotency:new-key", "processing", { nx: true, ex: 300 });
  });

  it("returns cached response when key has a completed response", async () => {
    const cached = { status: 201, body: { message: "done" } };
    mockGet.mockResolvedValue(cached);

    const result = await claimIdempotencyKey("existing-key");

    expect(result).toEqual({ claimed: false, response: cached });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("returns 409 conflict when key is currently being processed", async () => {
    mockGet.mockResolvedValue("processing");

    const result = await claimIdempotencyKey("in-progress-key");

    expect(result.claimed).toBe(false);
    if (!result.claimed) {
      expect(result.response.status).toBe(409);
    }
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("returns 409 conflict when SET NX fails (another request claimed first)", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue(null);

    const result = await claimIdempotencyKey("raced-key");

    expect(result.claimed).toBe(false);
    if (!result.claimed) {
      expect(result.response.status).toBe(409);
    }
  });

  it("returns claimed when key is empty string", async () => {
    const result = await claimIdempotencyKey("");

    expect(result).toEqual({ claimed: true });
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });
});

describe("setIdempotentResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores response with 24-hour TTL", async () => {
    mockSet.mockResolvedValue("OK");

    await setIdempotentResponse("completed-key", 201, { message: "done" });

    expect(mockSet).toHaveBeenCalledWith(
      "idempotency:completed-key",
      { status: 201, body: { message: "done" } },
      { ex: 86400 },
    );
  });
});
