import "server-only";
import { Redis } from "@upstash/redis";

const IDEMPOTENCY_TTL = 86400;
const LOCK_TTL = 300;

interface CachedResponse {
  status: number;
  body: unknown;
}

type ClaimResult = { claimed: true } | { claimed: false; response: CachedResponse };

function createIdempotencyStore() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const redis = createIdempotencyStore();

export async function claimIdempotencyKey(key: string): Promise<ClaimResult> {
  if (!redis || !key) return { claimed: true };

  const existing = await redis.get<CachedResponse | "processing">(`idempotency:${key}`);
  if (existing === "processing") {
    return {
      claimed: false,
      response: { status: 409, body: { error: { code: "CONFLICT", message: "Request is already being processed" } } },
    };
  }
  if (existing && typeof existing === "object") {
    return { claimed: false, response: existing };
  }

  const result = await redis.set(`idempotency:${key}`, "processing", { nx: true, ex: LOCK_TTL });
  if (result !== "OK") {
    return {
      claimed: false,
      response: { status: 409, body: { error: { code: "CONFLICT", message: "Request is already being processed" } } },
    };
  }

  return { claimed: true };
}

export async function setIdempotentResponse(key: string, status: number, body: unknown): Promise<void> {
  if (!redis || !key) return;

  await redis.set(`idempotency:${key}`, { status, body }, { ex: IDEMPOTENCY_TTL });
}
