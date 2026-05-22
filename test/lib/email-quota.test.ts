import { vi } from "vitest";

const mockIncrby = vi.fn();
const mockDecrby = vi.fn();
const mockExpire = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: class {
    incrby = mockIncrby;
    decrby = mockDecrby;
    expire = mockExpire;
  },
}));

vi.mock("@/env", () => ({
  env: {
    UPSTASH_REDIS_REST_URL: "https://fake.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "fake-token",
    DAILY_EMAIL_LIMIT: 300,
  },
}));

import { reserveEmailQuota } from "@/lib/email-quota";

describe("reserveEmailQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows full reservation when under limit", async () => {
    mockIncrby.mockResolvedValue(100);

    const result = await reserveEmailQuota(100);

    expect(result).toEqual({ allowed: 100, total: 100 });
    expect(mockIncrby).toHaveBeenCalledWith(expect.stringContaining("prfc:email-sent:"), 100);
    expect(mockDecrby).not.toHaveBeenCalled();
    expect(mockExpire).toHaveBeenCalled();
  });

  it("partially allows when reservation would exceed limit", async () => {
    mockIncrby.mockResolvedValue(350);

    const result = await reserveEmailQuota(150);

    expect(result).toEqual({ allowed: 100, total: 300 });
    expect(mockDecrby).toHaveBeenCalledWith(expect.stringContaining("prfc:email-sent:"), 50);
  });

  it("allows zero when already at limit", async () => {
    mockIncrby.mockResolvedValue(350);

    const result = await reserveEmailQuota(50);

    expect(result).toEqual({ allowed: 0, total: 300 });
    expect(mockDecrby).toHaveBeenCalledWith(expect.stringContaining("prfc:email-sent:"), 50);
  });

  it("sets TTL of 48 hours on the key", async () => {
    mockIncrby.mockResolvedValue(10);

    await reserveEmailQuota(10);

    expect(mockExpire).toHaveBeenCalledWith(expect.stringContaining("prfc:email-sent:"), 172800);
  });

  it("handles concurrent reservations via atomic INCRBY", async () => {
    mockIncrby.mockResolvedValueOnce(200).mockResolvedValueOnce(350);

    const [result1, result2] = await Promise.all([reserveEmailQuota(200), reserveEmailQuota(150)]);

    expect(result1).toEqual({ allowed: 200, total: 200 });
    expect(result2).toEqual({ allowed: 100, total: 300 });
    expect(mockIncrby).toHaveBeenCalledTimes(2);
    expect(mockDecrby).toHaveBeenCalledTimes(1);
  });
});
